import { ref } from 'vue';
import { defineStore } from 'pinia';

type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light');

  const toggleTheme = (_theme: Theme) => {
    theme.value = _theme;
  };

  return { theme, toggleTheme };
});
