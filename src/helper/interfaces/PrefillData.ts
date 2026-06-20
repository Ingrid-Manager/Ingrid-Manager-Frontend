export interface PrefillData {
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
  roomId?: number;
  isSeries?: boolean;
  weekdays?: number[];
  frequency?: 'WEEKLY' | 'BIWEEKLY';
  runDuringSchoolHolidays?: boolean;
  seriesEnd?: string;
}
