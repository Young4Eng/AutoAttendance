/** Prefer roster name; empty → 학생NN (no stitch real-name mocks). */
export function displayName(number: number, name: string): string {
  const n = (name ?? "").trim();
  if (!n) return `학생${String(number).padStart(2, "0")}`;
  return n;
}

export function padNum(n: number): string {
  return String(n).padStart(2, "0");
}
