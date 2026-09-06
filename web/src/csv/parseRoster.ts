/** grade,class,number,name — keep number gaps; never invent missing numbers. */

export interface ParsedStudentRow {
  grade: number;
  class: number;
  number: number;
  name: string;
}

/** Sample with gaps (1,2,3,4,7,9). Pseudonyms only — no real names. */
export const SAMPLE_ROSTER_CSV = `grade,class,number,name
2,3,1,학생01
2,3,2,학생02
2,3,3,학생03
2,3,4,학생04
2,3,7,학생07
2,3,9,학생09
`;

/** Build sample CSV using the teacher's grade/class; keep empty-number gaps. */
export function sampleRosterCsv(grade: number, klass: number): string {
  const g = Number.isInteger(grade) && grade > 0 ? grade : 2;
  const c = Number.isInteger(klass) && klass > 0 ? klass : 3;
  return SAMPLE_ROSTER_CSV.replace(/^2,3,/gm, `${g},${c},`);
}

/** Map parser/decoder error codes to short Korean UI copy (never echo name cells). */
export function formatRosterCsvError(err: unknown): string {
  const code = err instanceof Error ? err.message : 'csv_error';
  switch (code) {
    case 'empty_csv':
      return 'CSV가 비어 있습니다.';
    case 'csv_header':
      return '첫 줄 헤더가 필요합니다: grade,class,number,name';
    case 'csv_number':
      return 'grade·class·number는 숫자만 입력하세요 (예: 2,3,1). 「2학년」「3반」형태는 사용할 수 없습니다.';
    case 'csv_row':
      return '행 값이 올바르지 않습니다. number는 1 이상, name은 비울 수 없습니다.';
    case 'csv_name':
      return 'name에 < > 문자는 사용할 수 없습니다.';
    case 'csv_dup':
      return '같은 학년·반·번호가 중복되었습니다.';
    case 'csv_encoding':
      return 'CSV 글자가 깨졌습니다. 엑셀에서 「CSV UTF-8(쉼표로 분리)」로 저장하거나, 메모장→다른 이름으로 저장→UTF-8 후 다시 올려 주세요. CP949(한글 Windows)도 지원합니다.';
    default:
      return `CSV 처리 실패 (${code})`;
  }
}

function isDigitsOnly(raw: string): boolean {
  return /^\d+$/.test(raw.trim());
}

export function parseRosterCsv(text: string): ParsedStudentRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('empty_csv');
  }
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const gi = header.indexOf('grade');
  const ci = header.indexOf('class');
  const ni = header.indexOf('number');
  const namei = header.indexOf('name');
  if (gi < 0 || ci < 0 || ni < 0 || namei < 0) {
    throw new Error('csv_header');
  }
  const rows: ParsedStudentRow[] = [];
  const seen = new Set<string>();
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map((c) => c.trim());
    const gradeRaw = cols[gi] ?? '';
    const classRaw = cols[ci] ?? '';
    const numberRaw = cols[ni] ?? '';
    const name = cols[namei] ?? '';
    // Reject "2학년"/"3반" style — digits only (readable csv_number in UI).
    if (!isDigitsOnly(gradeRaw) || !isDigitsOnly(classRaw) || !isDigitsOnly(numberRaw)) {
      throw new Error('csv_number');
    }
    const grade = Number(gradeRaw);
    const klass = Number(classRaw);
    const number = Number(numberRaw);
    if (!Number.isInteger(grade) || !Number.isInteger(klass) || !Number.isInteger(number)) {
      throw new Error('csv_number');
    }
    if (number < 1 || !name) {
      throw new Error('csv_row');
    }
    if (name.includes('<') || name.includes('>')) {
      throw new Error('csv_name');
    }
    if (name.includes('\uFFFD')) {
      throw new Error('csv_encoding');
    }
    const key = `${grade}|${klass}|${number}`;
    if (seen.has(key)) {
      throw new Error('csv_dup');
    }
    seen.add(key);
    rows.push({ grade, class: klass, number, name });
  }
  // Do NOT fill gaps between numbers.
  return rows.sort((a, b) => a.number - b.number);
}
