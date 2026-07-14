import http from '@/api/http';

export async function deleteResourceEvent(id: number): Promise<void> {
  await http.delete(`/resource-events/${id}`);
}
