import http from '@/api/http';

interface VersionResponse {
  version: string;
}

export async function getBackendVersion(): Promise<string> {
  const response = await http.get<VersionResponse>('/settings/version');
  return response.data.version;
}
