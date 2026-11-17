/** Calendar-day helpers. All days are YYYY-MM-DD strings handled in UTC. */

export function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  return toDay(new Date());
}

export function parseDay(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + n);
  return toDay(d);
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  const dow = parseDay(day).getUTCDay(); // 0 = Sunday
  return addDays(day, -((dow + 6) % 7));
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function monthEnd(day: string): string {
  const d = parseDay(monthStart(day));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return toDay(d);
}

export function ageFrom(birthDate: string | null | undefined, on: string): number | null {
  if (!birthDate) return null;
  const b = parseDay(birthDate);
  const t = parseDay(on);
  let age = t.getUTCFullYear() - b.getUTCFullYear();
  const m = t.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && t.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export const round = (n: number, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
