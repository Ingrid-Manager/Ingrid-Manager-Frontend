import http from '@/api/http';

import type { RoomNames } from '@/helper/interfaces/room/RoomNames';

export async function getRoomNames(): Promise<RoomNames[]> {
  const response = await http.get('/rooms/names');

  return response.data;
}
