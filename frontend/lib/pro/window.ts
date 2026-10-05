/** Ventana de 12 meses móviles y SKU "año calendario siguiente" (nov–ene). */

export function ym(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(startYm: string, n: number): string {
  const [y, m] = startYm.split("-").map(Number);
  const dt = Date.UTC(y, m - 1 + n, 1);
  return ym(new Date(dt));
}

export function rollingWindow(from: Date = new Date()): {
  start: string;
  end: string;
  months: string[];
  kind: "rolling12";
} {
  const start = ym(from);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
  return { start, end: months[11], months, kind: "rolling12" };
}

export function nextCalendarWindow(from: Date = new Date()): {
  start: string;
  end: string;
  months: string[];
  kind: "calendar";
  year: number;
} {
  const year = from.getUTCFullYear() + 1;
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  return { start: months[0], end: months[11], months, kind: "calendar", year };
}

export function monthRangeIso(monthKey: string): { start_date: string; end_date: string } {
  const start_date = `${monthKey}-01`;
  const endMonth = addMonths(monthKey, 1);
  const end_date = `${endMonth}-01`;
  return { start_date, end_date };
}

export function rangeForWindow(months: string[]): { start_date: string; end_date: string } {
  const start_date = `${months[0]}-01`;
  const after = addMonths(months[months.length - 1], 1);
  const last = new Date(Date.UTC(Number(after.slice(0, 4)), Number(after.slice(5, 7)) - 1, 0));
  const end_date = last.toISOString().slice(0, 10);
  return { start_date, end_date };
}

export function currentMonthKey(from: Date = new Date()): string {
  return ym(from);
}
