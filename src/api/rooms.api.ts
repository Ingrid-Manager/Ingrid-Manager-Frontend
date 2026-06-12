import http from '@/api/http';
import type { Room } from '@/helper/interfaces/room/Room';

export interface CreateRoomPayload {
  title: string;
  avm_id?: string;
  comfort_temp: number;
  empty_temp: number;
  prelim_time: number;
  heated: boolean;
  color?: string;
  hidden?: boolean;
  locationid?: number;
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {}

export async function getRooms(): Promise<Room[]> {
  const response = await http.get('/rooms/list');
  return response.data;
}

export async function getRoom(id: number): Promise<Room> {
  const response = await http.post('/rooms/find', { id });
  return response.data;
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const response = await http.post('/rooms/create', payload);
  return response.data;
}

// Hinweis: Das Backend hat noch keinen PATCH-Endpunkt für Räume.
// Sobald dieser hinzugefügt wird, kann diese Funktion aktiviert werden:
// export async function updateRoom(id: number, payload: UpdateRoomPayload): Promise<Room> {
//   const response = await http.patch(`/rooms/${id}`, payload);
//   return response.data;
// }