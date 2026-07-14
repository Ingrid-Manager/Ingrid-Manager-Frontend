import http from '@/api/http';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';

export async function getResource(): Promise<ResourceNames[]> {
  const response = await http.get('/resource/list');
  return response.data;
}
