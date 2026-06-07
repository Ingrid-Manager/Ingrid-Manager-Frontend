import http from '@/api/http';

//TODO: Backend muss Delete unterstützen??

export async function deleteCalendarEvent(id: number) {
  await http.delete(`calendar-events/${id}`);
  console.log('test');
}