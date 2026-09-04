import type { AttendanceRecord } from '../types/models';

export type SendToExtensionResult =
  | { ok: true; accepted: number; rejected: number }
  | { ok: false; code: string; accepted?: number; rejected?: number };

type ExternalResponse = {
  ok?: boolean;
  code?: string;
  accepted?: number;
  rejected?: number;
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
  const extensionId = import.meta.env.VITE_EXTENSION_ID as string | undefined;
  if (!extensionId || !extensionId.trim()) {
    return Promise.resolve({ ok: false, code: 'missing_extension_id' });
  }

  const items = queue.filter((r) => r.status === 'queued');
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
        extensionId.trim(),
        { type: 'attendance.queue', items },
        (response) => {
          if (runtime.lastError) {
            resolve({ ok: false, code: 'runtime_error' });
            return;
          }
          if (!response || response.ok !== true) {
            resolve({
              ok: false,
              code: response?.code || 'rejected',
              accepted: response?.accepted,
              rejected: response?.rejected,
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
