import http from '@/api/http';

export async function splitSeriesEvent(id: number, payload: any) {
  const response = await http.patch(`/series-events/${id}/split`, payload);

  return response.data;
}
