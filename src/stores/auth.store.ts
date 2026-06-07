import { defineStore } from 'pinia';
import { loginApi, getMeApi, logoutApi } from '../api/auth.api';
import type { AxiosError } from 'axios';
import { User } from '@/helper/interfaces/user/User';

interface LoginResponse {
  token: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
    isAuthenticated: false,
    error: null as string | null,
  }),

  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;

      try {
        const data: LoginResponse = await loginApi(email, password);

        localStorage.setItem('access_token', data.token);

        this.isAuthenticated = true;
        await this.fetchUser();
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;

        if (error.response?.data?.message) {
          this.error = error.response.data.message;
          throw new Error(this.error);
        }

        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const message = Object.values(errors).flat().join(' ');
          this.error = message;
          throw new Error(message);
        }

        this.error = 'Login failed';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      try {
        const user = await getMeApi();
        this.user = user;
        this.isAuthenticated = true;
      } catch {
        this.logout();
      }
    },

    async logout() {
      try {
        await logoutApi();
      } catch {}

      localStorage.removeItem('access_token');

      this.user = null;
      this.isAuthenticated = false;

      window.location.href = '/login';
    },
  },
});
