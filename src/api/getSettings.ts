import http from '@/api/http';

export async function getOrgSettings() {
  const response = await http.get('/settings');
  return response.data;
}