import http from '@/api/http';

export interface ReorganizationHoliday {
  id: number;
  title: string;
  start: string;
  end: string;
}

export async function runReorganization(): Promise<{ success: boolean }> {
  const response = await http.post<{ success: boolean }>('/reorganization/run');
  return response.data;
}

export async function getHolidays(): Promise<ReorganizationHoliday[]> {
  const response = await http.get<ReorganizationHoliday[]>(
    '/reorganization/holidays',
  );
  return response.data;
}
