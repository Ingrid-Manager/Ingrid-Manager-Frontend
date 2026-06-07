import http from '@/api/http';

import type { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';

import { mapBackendEvent } from '@/helper/mapper/calendarEventMapper';

export async function fetchEvents(
  start: string,
  end: string,
): Promise<CalendarEvent[]> {
  const response = await http.post('/calendar-events/range', {
    start,
    end,
  });

  return response.data.map(mapBackendEvent);
}
