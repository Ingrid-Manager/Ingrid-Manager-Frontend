import http from '@/api/http';

export async function deleteSeriesEvent(id: number) {
  const response = await http.delete(`/series-events/${id}`);

  return response;
}
