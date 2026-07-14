import http from '@/api/http';
export async function updateResourceEvent(payload: {
  id: number;
  title?: string;
  start?: string;
  end?: string;
  resourceid?: number;
}) {
  console.log('[DEBUG] updateResourceEvent payload:', payload);
  const response = await http.patch('/resource-events', payload);
  console.log('[DEBUG] updateResourceEvent response:', response.data);
  return response.data;
}
