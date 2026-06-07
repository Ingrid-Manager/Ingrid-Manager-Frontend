import http from '@/api/http';

interface UpdateUserPayload {
  email?: string

  firstName?: string

  lastName?: string

  userFunction?: string | null

  role?: {
    id: number
  }

  status?: {
    id: number
  }
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
) {

  const response =
    await http.patch(
      `/users/${id}`,
      payload,
    );

  return response.data;
}