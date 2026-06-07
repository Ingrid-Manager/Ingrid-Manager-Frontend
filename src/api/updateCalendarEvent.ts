import http from '@/api/http';

export async function updateCalendarEvent(id: string, payload: any) {
  const response = await http.patch(`calendar-events`, payload);

  return response.data;
}
