import type { AttendanceRecord } from '../types/models';
import { STORE_EXTENSION_ID } from './storeLinks';

export type SendToExtensionResult =
  | { ok: true; accepted: number; rejected: number }
  | { ok: false; code: string; accepted?: number; rejected?: number; errors?: { row: number; code: string }[] };

type ExternalResponse = {
  ok?: boolean;
  code?: string;
  accepted?: number;
  rejected?: number;
  errors?: { row: number; code: string }[];
};

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          responseCallback?: (response: ExternalResponse) => void,
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

/**
 * 미리보기에서 확정한 queued만 확장으로 넘긴다.
 * 키는 data-contract 그대로. 확장 ID는 VITE_EXTENSION_ID.
 */
export function sendToExtension(
  queue: AttendanceRecord[],
): Promise<SendToExtensionResult> {
  const fromEnv = String(import.meta.env.VITE_EXTENSION_ID || '').trim();
  const legacy = new Set([
    'faccbfnnhlkbgfmbandaaiafdgmkmdek',
    'npfanefckmgojcofhneccimpaoneigcc',
  ]);
  const extensionId = fromEnv && !legacy.has(fromEnv) ? fromEnv : STORE_EXTENSION_ID;
  if (!extensionId) {
    return Promise.resolve({ ok: false, code: 'missing_extension_id' });
  }

  const items = queue
    .filter((r) => r.status === 'queued')
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.number - b.number;
    });
  if (items.length === 0) {
    return Promise.resolve({ ok: false, code: 'empty_queue' });
  }

  const runtime = window.chrome?.runtime;
  if (!runtime?.sendMessage) {
    return Promise.resolve({ ok: false, code: 'no_chrome_runtime' });
  }

  return new Promise((resolve) => {
    try {
      runtime.sendMessage(
        extensionId,
        { type: 'attendance.queue', items },
        (response) => {
          if (runtime.lastError) {
            const hint = String(runtime.lastError.message || '').slice(0, 180);
            resolve({ ok: false, code: hint ? `runtime_error:${hint}` : 'runtime_error' });
            return;
          }
          if (!response || response.ok !== true) {
            resolve({
              ok: false,
              code: response?.code || 'rejected',
              accepted: response?.accepted,
              rejected: response?.rejected,
              errors: response?.errors,
            });
            return;
          }
          resolve({
            ok: true,
            accepted: response.accepted ?? items.length,
            rejected: response.rejected ?? 0,
          });
        },
      );
    } catch {
      resolve({ ok: false, code: 'send_failed' });
    }
  });
}
