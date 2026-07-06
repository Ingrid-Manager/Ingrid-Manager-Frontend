import http from '@/api/http';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';

export async function getResourceNames(): Promise<ResourceNames[]> {
  const response = await http.get('/resource/names');
  return response.data;
}