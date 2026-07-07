<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ─── FullCalendar ─────────────────────────────────────────────────────────────
import FullCalendar from '@fullcalendar/vue3';
import type {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
  EventSourceFuncArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import deLocale from '@fullcalendar/core/locales/de';

// ─── Modal ────────────────────────────────────────────────────────────────────
import ResourcenModal from '@/components/modals/ResourcenModal.vue';
import type { BookingPayload } from '@/components/modals/ResourcenModal.vue';

// ─── API ──────────────────────────────────────────────────────────────────────
import { fetchResourceEvents } from '@/api/getResourceEvents';
import { createResourceEvent } from '@/api/createResourceEvent';
import { updateResourceEvent } from '@/api/updateResourceEvent';
import { deleteResourceEvent } from '@/api/deleteResourceEvent';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth.store';

// ─── Typen ────────────────────────────────────────────────────────────────────
interface ResourceCalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
  resourceId?: number;
  resourceTitle?: string;
  userId?: number;
  userName?: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
const auth = useAuthStore();
const calendarRef = ref();
const showModal = ref(false);
const modalRef = ref<InstanceType<typeof ResourcenModal> | null>(null);
const modalError = ref('');

const selectedEvent = ref<ResourceCalendarEvent | null>(null);
const isEditing = ref(false);
const prefillData = ref<{ start?: string; end?: string }>({});

// ─── Breakpoint ───────────────────────────────────────────────────────────────
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

// ─── Gastprüfung ──────────────────────────────────────────────────────────────
const isGuest = computed(() => auth.user?.role?.name === 'guest');

// ─── Bearbeitungsrecht ────────────────────────────────────────────────────────
const canEditEvent = computed(() => {
  const user = auth.user;
  if (!user) return false;
  if (!selectedEvent.value) return user.role?.name !== 'guest';
  if (user.role?.name === 'admin' || user.role?.name === 'verwaltung') return true;
  if (user.role?.name === 'guest') return false;
  return user.id === selectedEvent.value.userId;
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(prefill: { start?: string; end?: string } = {}) {
  prefillData.value = prefill;
  modalError.value = '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedEvent.value = null;
  isEditing.value = false;
  modalError.value = '';
}

// ─── Speichern ────────────────────────────────────────────────────────────────
async function onBookingSaved(payload: BookingPayload) {
  try {
    if (isEditing.value && selectedEvent.value?.id) {
      await updateResourceEvent({
        id: Number(selectedEvent.value.id),
        title: payload.title,
        start: payload.start,
        end: payload.end ?? payload.start,
        resourceid: Number(payload.resource),
      });
    } else {
      await createResourceEvent({
        title: payload.title,
        start: payload.start,
        end: payload.end ?? payload.start,
        resourceid: Number(payload.resource),
      });
    }

    closeModal();
    calendarRef.value?.getApi()?.refetchEvents();
  } catch (err: any) {
    console.error('Fehler beim Speichern:', err);
    if (err.response?.status === 409) {
      modalError.value = err.response.data.message;
      return;
    }
    modalError.value = 'Die Buchung konnte nicht gespeichert werden.';
  }
}

// ─── Löschen ──────────────────────────────────────────────────────────────────
async function onBookingDeleted(id: string) {
  try {
    await deleteResourceEvent(Number(id));
    calendarRef.value?.getApi()?.refetchEvents();
  } catch (err) {
    console.error('Fehler beim Löschen:', err);
  }
  closeModal();
}

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
      click: () => {
        selectedEvent.value = null;
        isEditing.value = false;
        openModal();
      },
    },
  },

  headerToolbar: isMobile.value
    ? {
        left: 'prev,next',
        center: 'title',
        right: isGuest.value ? '' : 'ressourceBuchen',
      }
    : {
        left: isGuest.value ? 'prev,next today' : 'prev,next today ressourceBuchen',
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

  // ─── Events aus API laden ──────────────────────────────────────────────────
  events: async (fetchInfo: EventSourceFuncArg) => {
    try {
      const events = await fetchResourceEvents(
        fetchInfo.startStr,
        fetchInfo.endStr,
      );
      return events.map((e) => ({
        id: String(e.id),
        title: e.title,
        start: e.start,
        end: e.end,
        color: e.color,
        extendedProps: {
          resourceId: e.resource_id,
          resourceTitle: e.resource_title,
          userId: e.user_id,
          userName: e.user_name,
        },
      }));
    } catch (err) {
      console.error('Fehler beim Laden der Events:', err);
      return [];
    }
  },

  // ─── Event klicken → bearbeiten ───────────────────────────────────────────
  eventClick: (info: EventClickArg) => {
    selectedEvent.value = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start?.toISOString() || '',
      end: info.event.end?.toISOString() || '',
      color: info.event.backgroundColor,
      resourceId: info.event.extendedProps.resourceId,
      resourceTitle: info.event.extendedProps.resourceTitle,
      userId: info.event.extendedProps.userId,
      userName: info.event.extendedProps.userName,
    };
    isEditing.value = true;
    openModal({
      start: info.event.start?.toISOString().split('T')[0],
      end: info.event.end?.toISOString().split('T')[0],
    });
  },

  // ─── Datum auswählen → erstellen ──────────────────────────────────────────
  select: (info: DateSelectArg) => {
    const start = info.startStr.split('T')[0];
    const endDate = new Date(info.endStr);
    endDate.setDate(endDate.getDate() - 1);
    const end = endDate.toISOString().split('T')[0];

    selectedEvent.value = null;
    isEditing.value = false;
    openModal({ start, end });

    setTimeout(() => modalRef.value?.prefillDates(start, end), 0);
  },
}));
</script>

<template>
  <div class="calendar-wrapper">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>

  <ResourcenModal
    ref="modalRef"
    :visible="showModal"
    :is-editing="isEditing"
    :event="selectedEvent"
    :can-edit="canEditEvent"
    :prefill="prefillData"
    :error-message="modalError"
    @close="closeModal"
    @saved="onBookingSaved"
    @delete="onBookingDeleted"
  />
</template>