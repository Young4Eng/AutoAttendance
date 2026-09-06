/** Decode roster CSV bytes: UTF-8 first, then CP949 (Windows-949 / EUC-KR). */

const CP949_LABELS = ['windows-949', 'euc-kr', 'korean'] as const;

function tryDecode(buf: ArrayBuffer, label: string, fatal: boolean): string | null {
  try {
    return new TextDecoder(label, { fatal }).decode(buf);
  } catch {
    return null;
  }
}

function hasReplacementChar(text: string): boolean {
  return text.includes('\uFFFD');
}

/** True when UTF-8 decode produced replacement chars (typical CP949 misread). */
export function looksBrokenEncoding(text: string): boolean {
  return hasReplacementChar(text);
}

/**
 * Decode roster file bytes.
 * Prefer UTF-8; on failure or replacement chars, retry CP949.
 * Rejects with `csv_encoding` rather than returning broken names.
 * Does not include name payloads in the error message.
 */
export function decodeRosterBytes(buf: ArrayBuffer): string {
  const utf8Fatal = tryDecode(buf, 'utf-8', true);
  if (utf8Fatal !== null && !looksBrokenEncoding(utf8Fatal)) {
    return utf8Fatal;
  }

  const utf8Loose = tryDecode(buf, 'utf-8', false);
  if (utf8Loose !== null && !looksBrokenEncoding(utf8Loose)) {
    return utf8Loose;
  }

  for (const label of CP949_LABELS) {
    const text = tryDecode(buf, label, true) ?? tryDecode(buf, label, false);
    if (text !== null && !looksBrokenEncoding(text)) {
      return text;
    }
  }

  throw new Error('csv_encoding');
}

/** Read a File/Blob as roster CSV text (UTF-8 → CP949). */
export async function decodeRosterCsvFile(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  return decodeRosterBytes(buf);
}
