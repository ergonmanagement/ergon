/**
 * Convert an ISO / Postgres timestamptz string to the format required by
 * `<input type="datetime-local">` (local wall time, no timezone suffix).
 */
export function isoToDateTimeLocalValue(iso: string): string {
  if (!iso || !iso.trim()) return "";
  const trimmed = iso.trim();
  // Already datetime-local shape (no Z / offset)
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) &&
    !trimmed.endsWith("Z") &&
    !/[+-]\d{2}:?\d{2}$/.test(trimmed)
  ) {
    return trimmed;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
