import http from '@/api/http';

interface ForgotPasswordPayload {
  email?: string
}

export async function resetPassword(
  payload: ForgotPasswordPayload,
) {
  const response =
    await http.post(
      `/auth/forgot/password`,
      payload,
    );

  return response.data;
}