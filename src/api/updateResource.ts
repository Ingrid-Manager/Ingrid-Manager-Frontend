import http from '@/api/http';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';

export async function updateResource(
  id: number,
  payload: {
    title?: string;
    color?: string;
    manager_email?: string;
    inventoryid?: string;
  },
): Promise<ResourceNames> {
  const response = await http.patch(`/resource/${id}`, payload);
  return response.data;
}
