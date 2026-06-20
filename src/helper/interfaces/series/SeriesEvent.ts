export interface SeriesEvent {
  id: number;

  title: string;
  description?: string;

  roomid: number;
  categoryid: number;

  startTime: string;
  endTime: string;

  seriesStart: string;
  seriesEnd: string;

  weekdays: number[];
  frequency: 'WEEKLY' | 'BIWEEKLY'

  runDuringSchoolHolidays: boolean;

  active: boolean;

  lastGeneratedUntil?: string;
  lastReorganizationAt?: string;
}