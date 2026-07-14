import http from '@/api/http';

interface VersionResponse {
  version: string;
}

// TODO: Pfad noch an den tatsächlichen Backend-Endpunkt anpassen
export async function getBackendVersion(): Promise<string> {
  const response = await http.get<VersionResponse>('/version');
  return response.data.version;
}
