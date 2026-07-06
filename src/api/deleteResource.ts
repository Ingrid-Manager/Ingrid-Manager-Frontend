import http from '@/api/http';

export async function deleteResource(id: number): Promise<void> {
  await http.delete(`/resource/delete/${id}`);
}