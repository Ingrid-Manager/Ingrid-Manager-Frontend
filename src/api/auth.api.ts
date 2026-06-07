import http from './http';

export async function loginApi(email: string, password: string) {
  const res = await http.post('/auth/email/login', {
    email,
    password,
  });

  return res.data;
}

export async function getMeApi() {
  const res = await http.get('/auth/me');
  return res.data;
}

export async function logoutApi() {
  await http.post('/auth/logout');
}
