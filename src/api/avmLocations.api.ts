import http from '@/api/http';
import type { Location } from '@/helper/interfaces/location/location';

export interface CreateAvmLocationPayload {
  title: string;
  ahaurl?: string;
  ahauser?: string;
  ahapassword?: string;
}

export interface UpdateAvmLocationPayload
  extends Partial<CreateAvmLocationPayload> {
  id: number;
}

export async function getAvmLocations(): Promise<Location[]> {
  const response = await http.get('/avm-locations');
  return response.data;
}

export async function createAvmLocation(
  payload: CreateAvmLocationPayload,
): Promise<Location> {
  const response = await http.post('/avm-locations', payload);
  return response.data;
}

export async function updateAvmLocation(
  payload: UpdateAvmLocationPayload,
): Promise<Location> {
  const response = await http.patch('/avm-locations', payload);
  return response.data;
}
