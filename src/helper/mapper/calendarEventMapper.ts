import type { BackendEvent } from '@/helper/interfaces/calendar/BackendEvent';

import type { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';

export function mapBackendEvent(e: BackendEvent): CalendarEvent {
  return {
    id: String(e.id),
    title: e.title,
    description: e.description,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    color: e.color,
    roomId: e.room_id,
    roomTitle: e.room_title,
    userId: e.user_id,
    userName: e.user_name,
    isBackground: e.isBackground,
    rrule: e.rrule,
  };
}
