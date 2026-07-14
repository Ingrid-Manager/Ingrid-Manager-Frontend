import http from '@/api/http';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';

export async function createResource(payload: {
  title: string;
  color: string;
  manager_email?: string;
  inventoryid?: string;
}): Promise<ResourceNames> {
  const response = await http.post('/resource/create', payload);
  return response.data;
}
