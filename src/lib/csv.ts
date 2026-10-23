/**
 * Quote a CSV cell. Values come from external systems, so anything that would be read as
 * a formula by Excel/Sheets (leading = + - @ tab CR) is prefixed with an apostrophe.
 */
export function csvCell(value: unknown): string {
  const s = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}
