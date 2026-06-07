import http from '@/api/http';

export async function createEvent(
  payload: unknown,
) {
  const response = await http.post(
    '/calendar-events',
    payload,
  );

  return response.data;
}