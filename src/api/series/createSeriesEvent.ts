import http from '@/api/http';
import { CreateSeriesEventPayload } from '@/helper/interfaces/calendar/CreateSeriesEventPayload';

export async function createSeriesEvent(payload: CreateSeriesEventPayload) {
  const response = await http.post(`/series-events/`, payload);

  return response.data;
}
