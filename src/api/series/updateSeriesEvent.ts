import http from '@/api/http';

export async function updateSeriesEvent(id: number, payload: any) {
  const response = await http.patch(`/series-events/${id}`, payload);

  return response.data;
}
