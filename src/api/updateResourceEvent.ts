import http from '@/api/http';

export async function updateResourceEvent(payload: {
  id: number;
  title?: string;
  start?: string;
  end?: string;
  resourceid?: number;
}) {
  const response = await http.patch('/resource-events', payload);
  return response.data;
}