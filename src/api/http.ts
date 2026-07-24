import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

type RefreshSubscriber = (token: string) => void;

let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

function subscribeTokenRefresh(cb: RefreshSubscriber) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(http(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post<{
          token: string;
          refreshToken: string;
        }>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const {
          token: newToken,
          refreshToken: newRefreshToken,
        } = res.data;

        localStorage.setItem('access_token', newToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        onRefreshed(newToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return http(originalRequest);
      } catch (err) {
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        window.location.href = '/auth/login';

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default http;