import http from '@/api/http';
import type { Location } from '@/helper/interfaces/location/location';

export async function getAvmLocations(): Promise<Location[]> {
  const response = await http.get('/avm-locations');
  return response.data;
}