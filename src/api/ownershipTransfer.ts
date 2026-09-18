import http from '@/api/http';

export interface TransferOwnerPayload {
  seriesId?: number;
  calendarEventId?: number;
  newOwnerId: number;
}

export interface TransferOwnerResult {
  success: true;
  seriesId?: number;
  calendarEventId?: number;
  newOwnerId: number;
  affectedCalendarEvents?: number;
}

export async function transferOwner(
  payload: TransferOwnerPayload,
): Promise<TransferOwnerResult> {
  const response = await http.post<TransferOwnerResult>(
    '/ownership-transfer',
    payload,
  );
  return response.data;
}
