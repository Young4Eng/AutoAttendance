/** grade,class,number,name — keep number gaps; never invent missing numbers. */

export interface ParsedStudentRow {
  grade: number;
  class: number;
  number: number;
  name: string;
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
    const grade = Number(cols[gi]);
    const klass = Number(cols[ci]);
    const number = Number(cols[ni]);
    const name = cols[namei] ?? '';
    if (!Number.isInteger(grade) || !Number.isInteger(klass) || !Number.isInteger(number)) {
      throw new Error('csv_number');
    }
    if (number < 1 || !name) {
      throw new Error('csv_row');
    }
    if (name.includes('<') || name.includes('>')) {
      throw new Error('csv_name');
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
