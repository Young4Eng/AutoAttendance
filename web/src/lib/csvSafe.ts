/** Excel 식 실행 방지. 선두 = + - @ 탭 제거. */
export function stripCsvFormula(raw: string): string {
  return String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/^[=+\-@\t]+/, '')
    .trim();
}
