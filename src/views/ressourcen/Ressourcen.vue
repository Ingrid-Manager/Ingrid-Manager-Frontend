<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ─── FullCalendar ─────────────────────────────────────────────────────────────
import FullCalendar from '@fullcalendar/vue3';
import type {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import deLocale from '@fullcalendar/core/locales/de';

// ─── Modal-Komponente ─────────────────────────────────────────────────────────
import RessourcenModal from '@/components/modals/RessourcenModal.vue';
import type { BookingPayload } from '@/components/modals/RessourcenModal.vue';

// ─── Typen ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
  extendedProps?: Record<string, unknown>;
}

// ─── Beispiel-Events (später durch API-Daten ersetzen) ────────────────────────
const calendarEvents = ref<CalendarEvent[]>([
  { id: '1',  title: 'Beamer',           start: '2026-05-01', end: '2026-05-02', color: '#321fdb' },
  { id: '2',  title: 'Floorspots',       start: '2026-05-03', end: '2026-05-05', color: '#2eb85c' },
  { id: '3',  title: 'Auto (Kleinwagen)',start: '2026-05-04', end: '2026-05-06', color: '#e55353' },
  { id: '4',  title: 'Moderationskoffer',start: '2026-05-07', color: '#f9b115' },
  { id: '5',  title: 'Beamer',           start: '2026-05-08', end: '2026-05-09', color: '#321fdb' },
  { id: '6',  title: 'Floorspots',       start: '2026-05-10', end: '2026-05-12', color: '#2eb85c' },
  { id: '7',  title: 'Auto (Transporter)',start: '2026-05-11', end: '2026-05-13', color: '#e55353' },
  { id: '8',  title: 'Moderationskoffer',start: '2026-05-14', color: '#f9b115' },
  { id: '9',  title: 'Beamer',           start: '2026-05-15', end: '2026-05-16', color: '#321fdb' },
  { id: '10', title: 'Floorspots',       start: '2026-05-17', end: '2026-05-19', color: '#2eb85c' },
  { id: '11', title: 'Auto (Kleinwagen)',start: '2026-05-18', end: '2026-05-20', color: '#e55353' },
  { id: '12', title: 'Moderationskoffer',start: '2026-05-21', color: '#f9b115' },
  { id: '13', title: 'Beamer',           start: '2026-05-22', end: '2026-05-23', color: '#321fdb' },
  { id: '14', title: 'Floorspots',       start: '2026-05-24', end: '2026-05-25', color: '#2eb85c' },
  { id: '15', title: 'Auto (Transporter)',start: '2026-05-26', end: '2026-05-28', color: '#e55353' },
  { id: '16', title: 'Moderationskoffer',start: '2026-05-29', color: '#f9b115' },
  { id: '17', title: 'Beamer',           start: '2026-05-30', end: '2026-05-31', color: '#321fdb' },
  { id: '18', title: 'Floorspots',       start: '2026-06-01', end: '2026-06-03', color: '#2eb85c' },
  { id: '19', title: 'Auto (Kleinwagen)',start: '2026-06-04', end: '2026-06-05', color: '#e55353' },
  { id: '20', title: 'Moderationskoffer',start: '2026-06-06', color: '#f9b115' },
  { id: '21', title: 'Beamer',           start: '2026-04-10', end: '2026-04-11', color: '#321fdb' },
  { id: '22', title: 'Floorspots',       start: '2026-04-14', end: '2026-04-16', color: '#2eb85c' },
  { id: '23', title: 'Auto (Transporter)',start: '2026-04-20', end: '2026-04-22', color: '#e55353' },
  { id: '24', title: 'Moderationskoffer',start: '2026-04-25', color: '#f9b115' },
  { id: '25', title: 'Beamer',           start: '2026-04-28', end: '2026-04-29', color: '#321fdb' },
]);

// ─── Modal-Ref & Sichtbarkeit ─────────────────────────────────────────────────
const showModal = ref(false);
const modalRef = ref<InstanceType<typeof RessourcenModal> | null>(null);

function openModal() {
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function onBookingSaved(payload: BookingPayload) {
  const newEvent: CalendarEvent = {
    id: payload.id,
    title: payload.title,
    start: payload.start,
    end: payload.end,
    color: payload.color,
  };
  calendarEvents.value = [...calendarEvents.value, newEvent];

    console.log('Neue Ressourcenbuchung:', payload);
}

// ─── Breakpoint & Responsive Kalendergröße ───────────────────────────────────
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);
const isMobile = computed(() => windowWidth.value < 900);

function onResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => window.addEventListener('resize', onResize));
onUnmounted(() => window.removeEventListener('resize', onResize));

const calendarSizing = computed(() => {
  const isDesktop = windowWidth.value >= 992;

  if (isDesktop) {
    const height = windowHeight.value - 146;
    return { height: `${height}px`, aspectRatio: undefined };
  }

  if (windowWidth.value < 576) return { height: undefined, aspectRatio: 0.8 };
  if (windowWidth.value < 768) return { height: undefined, aspectRatio: 1.2 };
  return { height: undefined, aspectRatio: 1.6 };
});

// ─── FullCalendar-Optionen ────────────────────────────────────────────────────
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  locale: deLocale,
  height: calendarSizing.value.height,
  aspectRatio: calendarSizing.value.aspectRatio,

initialView: isMobile.value ? 'listMonth' : 'dayGridMonth',

  weekNumbers: true,
  

  customButtons: {
    ressourceBuchen: {
      text: 'Ressource buchen',
      click: () => openModal(),
    },
  },

  headerToolbar: isMobile.value
    ? {
        left: 'prev,next',
        center: 'title',
        right: 'ressourceBuchen',
      }
    : {
        left: 'prev,next today ressourceBuchen',
        center: 'title',
        right: 'dayGridMonth,listMonth',
      },

  buttonText: {
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    listMonth: 'Liste',
  },

  selectable: false,
  selectMirror: false,
  editable: false,
  dayMaxEvents: true,
  

  events: calendarEvents.value,

  select: (info: DateSelectArg) => {
    const start = info.startStr.split('T')[0];
    const endDate = new Date(info.endStr);
    endDate.setDate(endDate.getDate() - 1);
    const end = endDate.toISOString().split('T')[0];

    openModal();

    setTimeout(() => modalRef.value?.prefillDates(start, end), 0);
  },

  eventClick: (info: EventClickArg) => {
    console.log('Event geklickt:', info.event);
  },
}));
</script>

<template>
  <div class="calendar-wrapper">
    <FullCalendar :options="calendarOptions" />
  </div>

  <RessourcenModal
    ref="modalRef"
    :visible="showModal"
    @close="closeModal"
    @saved="onBookingSaved"
  />
</template>