<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ─── FullCalendar ─────────────────────────────────────────────────────────────
import FullCalendar from '@fullcalendar/vue3';
import type {
  CalendarOptions,
  EventApi,
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

// ─── Datums-Hilfsfunktion ─────────────────────────────────────────────────────

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getEventDisplayDates(event: EventApi): {
  start: string;
  endInclusive: string;
} {
  const start = event.start ? toLocalDateStr(event.start) : '';
  // event.end ist EXKLUSIV (Tag nach dem letzten gebuchten Tag).
  const endExclusive = event.end ? toLocalDateStr(event.end) : start;
  const endInclusive = shiftDate(endExclusive, -1);
  return { start, endInclusive };
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

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const tooltip = ref<HTMLElement | null>(null);

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
  if (user.role?.name === 'admin' || user.role?.name === 'verwaltung')
    return true;
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

function withApiTime(dateStr: string): string {
  return `${dateStr}T02:00:00.000Z`;
}

async function onBookingSaved(payload: BookingPayload) {
  try {
    const start = withApiTime(payload.start);
    const end = withApiTime(payload.end ?? payload.start);

    if (isEditing.value && selectedEvent.value?.id) {
      await updateResourceEvent({
        id: Number(selectedEvent.value.id),
        title: payload.title,
        start,
        end,
        resourceid: Number(payload.resource),
      });
    } else {
      await createResourceEvent({
        title: payload.title,
        start,
        end,
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
        left: isGuest.value
          ? 'prev,next today'
          : 'prev,next today ressourceBuchen',
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
  displayEventTime: false,

  // ─── Events aus API laden ──────────────────────────────────────────────────
  events: async (fetchInfo: EventSourceFuncArg) => {
    try {
      const events = await fetchResourceEvents(
        fetchInfo.startStr,
        fetchInfo.endStr,
      );
      return events.map((e) => {
        const startDateOnly = e.start.split('T')[0];
        const endDateOnly = (e.end ?? e.start).split('T')[0];
        const endExclusive = shiftDate(endDateOnly, 1);

        return {
          id: String(e.id),
          // Anzeige im Kalender: Ressourcen-Name + Beschreibung
          title: e.resource_title ? `${e.resource_title}: ${e.title}` : e.title,
          start: startDateOnly,
          end: endExclusive,
          allDay: true,
          color: e.color,
          extendedProps: {
            resourceId: e.resource_id,
            resourceTitle: e.resource_title,
            userId: e.user_id,
            userName: e.user_name,
            // Ursprünglicher Titel/Beschreibung ohne Ressourcen-Name (für Bearbeiten-Modus)
            rawTitle: e.title,
          },
        };
      });
    } catch (err) {
      console.error('Fehler beim Laden der Events:', err);
      return [];
    }
  },

  // ─── Event klicken → bearbeiten ───────────────────────────────────────────
  eventClick: (info: EventClickArg) => {
    const { start: startStr, endInclusive: endInclusiveStr } =
      getEventDisplayDates(info.event);

    selectedEvent.value = {
      id: info.event.id,
      title: info.event.extendedProps.rawTitle ?? info.event.title,
      start: startStr,
      end: endInclusiveStr,
      color: info.event.backgroundColor,
      resourceId: info.event.extendedProps.resourceId,
      resourceTitle: info.event.extendedProps.resourceTitle,
      userId: info.event.extendedProps.userId,
      userName: info.event.extendedProps.userName,
    };
    isEditing.value = true;
    openModal({ start: startStr, end: endInclusiveStr });
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
  // ─── Tooltip beim Hover anzeigen ───────────────────────────────────────────
  eventMouseEnter: (info) => {
    const rawTitle = info.event.extendedProps.rawTitle || info.event.title;
    const resourceTitle = info.event.extendedProps.resourceTitle || '';
    const userName = info.event.extendedProps.userName || '';

    // "yyyy-MM-dd" -> "dd.MM.yyyy"
    const formatDisplay = (iso: string) => {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}.${m}.${y}`;
    };

    const { start: startIso, endInclusive: endIso } = getEventDisplayDates(
      info.event,
    );

    const start = formatDisplay(startIso);
    const endDisplay = endIso !== startIso ? formatDisplay(endIso) : '';

    const el = document.createElement('div');

    el.className = 'calendar-tooltip';

    const tooltipHtml = `
  <div class="calendar-tooltip-title">
    ${rawTitle}
  </div>

  <div class="calendar-tooltip-row">
    <strong>Ressource:</strong>
    ${resourceTitle}
  </div>

  <div class="calendar-tooltip-row">
    <strong>Datum:</strong>
    ${endDisplay && endDisplay !== start ? `${start} - ${endDisplay}` : start}
  </div>

  ${
    userName
      ? `
  <div class="calendar-tooltip-row">
    <strong>Erstellt von:</strong>
    ${userName}
  </div>`
      : ''
  }
`;

    el.innerHTML = tooltipHtml;

    document.body.appendChild(el);

    const rect = info.el.getBoundingClientRect();

    el.style.top = `${rect.bottom + 8}px`;
    el.style.left = `${rect.left}px`;

    tooltip.value = el;
  },

  eventMouseLeave: () => {
    if (tooltip.value) {
      tooltip.value.remove();
      tooltip.value = null;
    }
  },
}));

//Tooltip Inner HTML
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
