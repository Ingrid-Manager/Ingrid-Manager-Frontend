import http from '@/api/http';
import { SeriesEvent } from '@/helper/interfaces/series/SeriesEvent';

export async function getAllSeriesEvents(): Promise<SeriesEvent[]> {
  const response = await http.get<SeriesEvent[]>('/series-events');
  return response.data;
}
