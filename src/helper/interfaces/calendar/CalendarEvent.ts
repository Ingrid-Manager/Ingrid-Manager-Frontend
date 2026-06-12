export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end?: string;
  allDay: boolean;
  color?: string;
  roomId: number;
  roomTitle: string;
  userId: number;
  userName: string;
  isBackground: boolean;
  rrule?: string;
}
