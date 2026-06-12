<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

import type {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventSourceFuncArg,
} from '@fullcalendar/core';

import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import listPlugin from '@fullcalendar/list'

import EventModal from '@/components/modals/EventModal.vue';
import { fetchEvents } from '@/api/getCalendar';
import { PrefillData } from '@/helper/interfaces/PrefillData';
import { useAuthStore } from '@/stores/auth.store';
import { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';
import { createEvent } from '@/api/createEvent';
import { getRoomNames } from '@/api/getRoomNames';
import { updateCalendarEvent } from '@/api/updateCalendarEvent';
import type { RoomNames } from '@/helper/interfaces/room/RoomNames';
import { deleteCalendarEvent } from '@/api/deleteEvent';


// ─── Breakpoint ───────────────────────────────────────────────────────────────
const windowWidth = ref(window.innerWidth)

const onResize = () => { windowWidth.value = window.innerWidth }

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const isMobile = computed(() => windowWidth.value < 1000)
// ─── Sidebar ──────────────────────────────────────────────────────────────────
const sidebarVisible = ref(true);
const rooms = ref<RoomNames[]>([]);
const modalError = ref('');
// Checked-State je Raum-ID – bereit für spätere Filterlogik
const roomChecked = ref<Record<number, boolean>>({});

onMounted(async () => {
  try {
    rooms.value = await getRoomNames()
    rooms.value.forEach((room) => {
      roomChecked.value[room.id] = true
    })
  } catch (err) {
    console.error('Fehler beim Laden der Räume:', err)
  }
});


watch(roomChecked, () => {
  const calendarApi = calendarRef.value?.getApi();
  calendarApi?.refetchEvents();
}, { deep: true });

//Tooltip & Event State
const tooltip = ref<HTMLElement | null>(null);
const selectedEvent = ref<CalendarEvent | null>(null);
const isEditing = ref(false);
const auth = useAuthStore();

const calendarRef = ref();
const showModal = ref(false);
const formData = ref<PrefillData>({
  startDate: '',
  endDate: '',
  title: '',
  description: '',
  roomId: 0,
});

function openModal(prefill: PrefillData = {}) {
  formData.value = prefill;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedEvent.value = null;
  isEditing.value = false;
  modalError.value = '';
}

async function handleSave(payload: any) {
  try {
    if (isEditing.value && selectedEvent.value?.id) {
      await updateCalendarEvent(selectedEvent.value.id, payload);
    } else {
      await createEvent(payload);
    }

    closeModal();
    calendarRef.value
      ?.getApi()
      ?.refetchEvents();
  } catch (err: any) {
    console.error('Fehler beim Speichern:', err);
    if (err.response?.status === 409) {
      modalError.value = err.response.data.message;
      return;
    }
    modalError.value = 'Der Termin konnte nicht gespeichert werden.';
  }
}

async function handleDelete(id: string) {
  try {
    await deleteCalendarEvent(Number(id));
    const calendarApi = calendarRef.value?.getApi();
    calendarApi?.refetchEvents();
  } catch (err) {
    console.error('Fehler beim Löschen:', err);
  }
}

const canEditEvent = computed(() => {
  const user = auth.user;

  if (!user) {
    return false;
  }

  if (!selectedEvent.value) {
    return user.role?.name !== 'guest';
  }

  if (user.role?.name === 'admin' || user.role?.name === 'verwaltung') {
    return true;
  }

  if (user.role?.name === 'guest') {
    return false;
  }

  return user.id === selectedEvent.value.userId;
});

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  locale: deLocale,

  // Standard: Monatsansicht
  initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
  scrollTime: '08:00:00',
  weekNumbers: true,
  // ─── NEU: Custom Button ───────────────────────────────────────────────────
  customButtons: {
    ressourceBuchen: {
      text: 'Termin erstellen',
      click: () => openModal(),
    },
  },
  eventClick: (info: EventClickArg) => {
    selectedEvent.value = {
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      start: info.event.start?.toISOString() || '',
      end: info.event.end?.toISOString() || '',
      allDay: info.event.allDay,
      color: info.event.backgroundColor,
      roomId: info.event.extendedProps.roomId,
      roomTitle: info.event.extendedProps.roomTitle,
      userId: info.event.extendedProps.userId,
      userName: info.event.extendedProps.userName,
      isBackground: info.event.extendedProps.isBackground,
    };

    isEditing.value = true;

    openModal({
      startDate: info.event.startStr.split('T')[0],
      endDate: info.event.endStr ? info.event.endStr.split('T')[0] : '',
      description: info.event.extendedProps.description,
      title: info.event.title,
      roomId: info.event.extendedProps.roomId,
    });
  },

  // Header-Toolbar mit Ansichts-Umschalter

  headerToolbar: isMobile.value
    ? {
      left: 'prev,next',
      center: 'title',
      right: 'ressourceBuchen',
    }
    : {
      //left: 'toggleSidebar prev,next today ressourceBuchen',
      left: 'prev,next today ressourceBuchen',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth',
    },
  views: {
    listWeek: {
      buttonText: 'Liste',
      titleFormat: isMobile.value
        ? { year: '2-digit', month: 'short', day: 'numeric' }
        : undefined,
    },
  },

  // Button-Beschriftungen auf Deutsch
  buttonText: {
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    listMonth: 'Liste',
  },

  // Interaktion
  selectable: false,
  selectMirror: false,
  editable: false, // Drag & Drop
  dayMaxEvents: true, // "+x weitere" bei vielen Events

  // Events alt
  // events: calendarEvents.value,

  events: async (fetchInfo: EventSourceFuncArg) => {
    try {
      const events = await fetchEvents(
        fetchInfo.startStr,
        fetchInfo.endStr,
      );

      return events
        .filter((e) => roomChecked.value[e.roomId] !== false)
        .map((e) => {
          const normalizedColor =
            e.color?.length === 5
              ? e.color.slice(0, 4)
              : e.color;

          return {
            id: String(e.id),
            title: e.title,
            allDay: e.allDay,
            color: normalizedColor,
                  start: e.start,
                  end: e.end,


            display: e.isBackground ? 'background' : 'block',

            extendedProps: {
              roomId: e.roomId,
              roomTitle: e.roomTitle,
              userId: e.userId,
              userName: e.userName,
              description: e.description,
            },
          };
        });

    } catch (err) {
      console.error('Fehler beim Laden der Events:', err,);
      return [];
    }
  },

  eventMouseEnter: (info) => {

    const userName = info.event.extendedProps.userName || '';

    const start =
      info.event.start
        ?.toLocaleTimeString(
          'de-DE',
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        ) || '';

    const end =
      info.event.end
        ?.toLocaleTimeString(
          'de-DE',
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        ) || '';

    const room =
      info.event.extendedProps.roomTitle || '';

    const description =
      info.event.extendedProps.description || '';

    const el = document.createElement('div');

    el.className = 'calendar-tooltip';

    el.innerHTML = `
  <div class="calendar-tooltip-title">
    ${info.event.title}
  </div>

  <div class="calendar-tooltip-row">
    <strong>Zeit:</strong>
    ${start} - ${end}
  </div>

  <div class="calendar-tooltip-row">
    <strong>Raum:</strong>
    ${room}
  </div>

  ${userName ? `
  <div class="calendar-tooltip-row">
    <strong>Erstellt von:</strong>
    ${userName}
  </div>` : ''}

  ${description
        ? `<div class="calendar-tooltip-description">${description}</div>`
        : ''
      }
`;

    document.body.appendChild(el);

    const rect =
      info.el.getBoundingClientRect();

    el.style.top =
      `${rect.bottom + 8}px`;

    el.style.left =
      `${rect.left}px`;

    tooltip.value = el;
  },

  eventMouseLeave: () => {

    if (tooltip.value) {

      tooltip.value.remove();

      tooltip.value = null;
    }
  },

  select: (info: DateSelectArg) => {
    const end = new Date(info.endStr);
    end.setDate(end.getDate() - 1);

    openModal({
      startDate: info.startStr.split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  },

  height: '100%',
}));
</script>

<template>
  <!--
    .calendar-page füllt den gesamten Bereich unterhalb des AppHeader aus
    (flex-grow: 1 kommt vom app-content in DefaultLayout).
    Sidebar und Kalender liegen nebeneinander in einer Flex-Zeile.
    Die Sidebar hat keinerlei position:fixed – sie ist ein normales Flex-Kind.
  -->
  <div class="calendar-page" :class="{ 'calendar-page--mobile': isMobile }">

    <!-- Sidebar: auf Desktop links, auf Mobile unten (via CSS order) -->
    <aside class="room-sidebar" :class="{
      'room-sidebar--hidden': !sidebarVisible && !isMobile,
      'room-sidebar--mobile': isMobile,
    }">
      <div class="room-sidebar__header">
        <span class="room-sidebar__title">Raumlegende</span>
      </div>

      <ul class="room-sidebar__list">
        <li v-for="room in rooms" :key="room.id" class="room-sidebar__item">
          <label :for="`room-cb-${room.id}`" class="room-sidebar__row">
            <input type="checkbox" :id="`room-cb-${room.id}`" v-model="roomChecked[room.id]"
              class="room-sidebar__checkbox" :style="{ '--room-color': room.color || '#321fdb' }" />
            <span class="room-sidebar__label" :class="{ 'room-sidebar__label--unchecked': !roomChecked[room.id] }">
              {{ room.title }}
            </span>
          </label>
        </li>

        <li v-if="rooms.length === 0" class="room-sidebar__empty">
          Keine Räume gefunden.
        </li>
      </ul>
    </aside>

    <!-- ── Kalender ─────────────────────────────────────────────────────────── -->
    <div class="calendar-wrapper" :style="isMobile ? { height: '75dvh' } : {}">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

  </div>

  <EventModal :visible="showModal" :prefill="formData" :event="selectedEvent" :is-editing="isEditing"
    :can-edit="canEditEvent" :error-message="modalError" @close="closeModal" @save="handleSave" @delete="handleDelete" />

</template>
