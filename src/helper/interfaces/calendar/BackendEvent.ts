export interface BackendEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  room_id: number;
  room_title: string;
  user_id: number;
  user_name: string;
  isBackground: boolean;
  rrule: string;
}
