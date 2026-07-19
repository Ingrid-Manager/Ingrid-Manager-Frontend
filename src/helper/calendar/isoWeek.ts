// src/helper/calendar/isoWeek.ts

/**
 * Liefert Montag und Sonntag der ISO-Kalenderwoche, in der `date` liegt.
 */
export function getIsoWeekRange(date: Date): { monday: Date; sunday: Date } {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Montag ... 6 = Sonntag
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

export function toIsoDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
