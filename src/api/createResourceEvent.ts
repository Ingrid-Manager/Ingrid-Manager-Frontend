import http from '@/api/http';

export async function createResourceEvent(payload: {
  title: string;
  start: string;
  end: string;
  resourceid: number;
}) {
  const response = await http.post('/resource-events', payload);
  return response.data;
}
