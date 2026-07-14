/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<any, any, any>;

  export default component;
}
