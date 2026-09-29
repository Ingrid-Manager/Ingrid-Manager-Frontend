import { defineStore } from 'pinia';

// Verbindet den Zahnrad-Menüpunkt "Drucken" in AppHeader.vue (mobile) mit
// dem Druck-Modal in CalendarView.vue. Beide Komponenten stehen sich nicht
// in einer Eltern-Kind-Beziehung gegenüber, daher der Store als Brücke:
// AppHeader erhöht requestId, CalendarView beobachtet sie und öffnet das
// Modal (auch wenn CalendarView zu diesem Zeitpunkt noch nicht gemountet war).
export const usePrintTriggerStore = defineStore('printTrigger', {
  state: () => ({
    requestId: 0,
  }),

  actions: {
    requestPrint() {
      this.requestId++;
    },
  },
});
