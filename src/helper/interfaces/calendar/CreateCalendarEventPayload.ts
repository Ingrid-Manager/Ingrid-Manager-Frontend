export interface CreateCalendarEventPayload {
  title: string;
  description: string;
  start: string;
  end: string;
  roomId: number;
  isSeries: boolean;
}
