import { createApp } from 'vue';
import type { App as VueApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import '@/styles/main.scss';

// CoreUI
import CoreuiVue from '@coreui/vue';
import CIcon from '@coreui/icons-vue';
import { iconsSet as icons } from '@/assets/icons';

// Auth Store
import { useAuthStore } from '@/stores/auth.store';

const app: VueApp = createApp(App);
const pinia = createPinia();

// Plugins
app.use(pinia);
app.use(router);
app.use(CoreuiVue);

// Icons (Typed Provide)
app.provide('icons', icons as Record<string, string>);

// Global Components
app.component('CIcon', CIcon);

// Mount
app.mount('#app');

// Auth nach mount initialisieren
const auth = useAuthStore();

if (localStorage.getItem('access_token')) {
  auth.fetchUser();
}
