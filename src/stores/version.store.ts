import { defineStore } from 'pinia';
import { getBackendVersion } from '../api/getVersion';

export const useVersionStore = defineStore('version', {
  state: () => ({
    backendVersion: null as string | null,
    loading: false,
  }),

  actions: {
    async fetchBackendVersion() {
      if (this.backendVersion) return;

      this.loading = true;

      try {
        this.backendVersion = await getBackendVersion();
      } catch {
        this.backendVersion = 'unbekannt';
      } finally {
        this.loading = false;
      }
    },
  },
});
