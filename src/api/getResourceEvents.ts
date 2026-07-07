import http from '@/api/http';

export interface ResourceEventResponse {
  id: number;
  title: string;
  start: string;
  end: string;
  color?: string;
  resource_id?: number;
  resource_title?: string;
  user_id?: number;
  user_name?: string;
}

export async function fetchResourceEvents(
  start: string,
  end: string,
): Promise<ResourceEventResponse[]> {
  const response = await http.post('/resource-events/range', { start, end });
  return response.data;
}