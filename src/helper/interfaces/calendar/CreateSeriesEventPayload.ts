export interface CreateSeriesEventPayload {
  title: string;
  description: string;

  roomid: number;
  categoryid: number;

  startTime: string;
  endTime: string;

  seriesStart: string;
  seriesEnd: string;

  weekdays: number[];

  frequency: 'WEEKLY' | 'BIWEEKLY';

  runDuringSchoolHolidays: boolean;
}