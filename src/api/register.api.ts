import http from '@/api/http'
import type { RegisterPayload } from '@/helper/interfaces/auth/RegisterPayload'

export async function register ( payload: RegisterPayload) {
  const response = await http.post('/auth/email/register', payload);
  return response.data;
}