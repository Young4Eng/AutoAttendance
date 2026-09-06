/** Smoke: roster CSV digits-only + UTF-8/CP949 decode. Pseudonyms only (학생01). */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, '../web/fixtures/roster-gaps.csv'), 'utf8');

function isDigitsOnly(raw) {
  return /^\d+$/.test(String(raw).trim());
}

function parseRosterCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error('empty_csv');
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const gi = header.indexOf('grade');
  const ci = header.indexOf('class');
  const ni = header.indexOf('number');
  const namei = header.indexOf('name');
  if (gi < 0 || ci < 0 || ni < 0 || namei < 0) throw new Error('csv_header');
  const rows = [];
  const seen = new Set();
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map((c) => c.trim());
    const gradeRaw = cols[gi] ?? '';
    const classRaw = cols[ci] ?? '';
    const numberRaw = cols[ni] ?? '';
    const name = cols[namei] ?? '';
    if (!isDigitsOnly(gradeRaw) || !isDigitsOnly(classRaw) || !isDigitsOnly(numberRaw)) {
      throw new Error('csv_number');
    }
    const grade = Number(gradeRaw);
    const klass = Number(classRaw);
    const number = Number(numberRaw);
    if (!Number.isInteger(grade) || !Number.isInteger(klass) || !Number.isInteger(number)) {
      throw new Error('csv_number');
    }
    if (number < 1 || !name) throw new Error('csv_row');
    if (name.includes('<') || name.includes('>')) throw new Error('csv_name');
    if (name.includes('\uFFFD')) throw new Error('csv_encoding');
    const key = `${grade}|${klass}|${number}`;
    if (seen.has(key)) throw new Error('csv_dup');
    seen.add(key);
    rows.push({ grade, class: klass, number, name });
  }
  return rows.sort((a, b) => a.number - b.number);
}

function decodeRosterBytes(buf) {
  const tryDecode = (label, fatal) => {
    try {
      return new TextDecoder(label, { fatal }).decode(buf);
    } catch {
      return null;
    }
  };
  const broken = (t) => t.includes('\uFFFD');
  const utf8Fatal = tryDecode('utf-8', true);
  if (utf8Fatal !== null && !broken(utf8Fatal)) return utf8Fatal;
  const utf8Loose = tryDecode('utf-8', false);
  if (utf8Loose !== null && !broken(utf8Loose)) return utf8Loose;
  for (const label of ['windows-949', 'euc-kr', 'korean']) {
    const text = tryDecode(label, true) ?? tryDecode(label, false);
    if (text !== null && !broken(text)) return text;
  }
  throw new Error('csv_encoding');
}

const rows = parseRosterCsv(fixture);
assert.deepEqual(
  rows.map((r) => r.number),
  [1, 2, 3, 4, 7, 9],
);
assert.equal(rows[0].name, '학생01');

assert.throws(
  () => parseRosterCsv('grade,class,number,name\n2학년,3,1,학생01\n'),
  (e) => e instanceof Error && e.message === 'csv_number',
);

// CP949: 학생01 → [199, 208, 187, 253, 48, 49]
const header = Buffer.from('grade,class,number,name\n2,3,1,', 'ascii');
const nameCp949 = Buffer.from([199, 208, 187, 253, 48, 49]);
const nl = Buffer.from('\n');
const cp949Buf = Buffer.concat([header, nameCp949, nl]);
const decoded = decodeRosterBytes(cp949Buf.buffer.slice(cp949Buf.byteOffset, cp949Buf.byteOffset + cp949Buf.byteLength));
const cpRows = parseRosterCsv(decoded);
assert.equal(cpRows.length, 1);
assert.equal(cpRows[0].name, '학생01');

// UTF-8 bytes also OK
const utf8Buf = Buffer.from(fixture, 'utf8');
const decodedUtf8 = decodeRosterBytes(
  utf8Buf.buffer.slice(utf8Buf.byteOffset, utf8Buf.byteOffset + utf8Buf.byteLength),
);
assert.equal(parseRosterCsv(decodedUtf8).length, 6);

console.log('roster-csv.test.mjs OK');
