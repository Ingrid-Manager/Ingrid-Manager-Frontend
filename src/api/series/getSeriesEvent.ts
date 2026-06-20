import http from '@/api/http';
import { SeriesEvent } from '@/helper/interfaces/series/SeriesEvent';

export async function getSeriesEvent(id: number): Promise<SeriesEvent> {
  const response = await http.get(`/series-events/${id}`);

  return response.data;
}
