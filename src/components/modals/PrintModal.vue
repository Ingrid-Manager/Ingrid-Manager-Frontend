<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import type { RoomNames } from '@/helper/interfaces/room/RoomNames';
import {
  printCalendar,
  downloadFromUrl,
  type PrintViewType,
} from '@/api/printCalendar';

/** Muss mit MAX_PRINTABLE_ROOMS im Backend (print-calendar.dto.ts)
 *  übereinstimmen — die Druckvorlagen sind für mehr Räume nicht
 *  ausgelegt (Legende/Farben, v. a. in der Jahresansicht). */
const MAX_PRINTABLE_ROOMS = 10;

const props = defineProps<{
  visible: boolean;
  rooms: RoomNames[];
  /** Datum, das aktuell im Kalender sichtbar ist – dient als Vorbelegung */
  initialDate?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function today(): string {
  // Lokales Datum, NICHT über toISOString() (das würde zuerst in UTC
  // umrechnen und könnte kurz nach Mitternacht in Zeitzonen vor UTC
  // auf den Vortag zurückfallen).
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const printType = ref<PrintViewType>('week');
const printDate = ref<string>(props.initialDate || today());
const selectedRoomIds = ref<number[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const maxReached = computed(
  () => selectedRoomIds.value.length >= MAX_PRINTABLE_ROOMS,
);

// Sobald das Modal geöffnet wird: Datum vorbelegen und standardmäßig
// die ersten MAX_PRINTABLE_ROOMS Räume auswählen (nicht alle, falls es
// mehr als das Druck-Limit gibt).
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      printDate.value = props.initialDate || today();
      selectedRoomIds.value = props.rooms
        .slice(0, MAX_PRINTABLE_ROOMS)
        .map((room) => room.id);
      errorMessage.value = '';
    }
  },
);

const typeLabel = computed(() => {
  switch (printType.value) {
    case 'week':
      return 'Woche';
    case 'month':
      return 'Monat';
    case 'year':
      return 'Jahr';
    default:
      return '';
  }
});

function toggleRoom(id: number) {
  const idx = selectedRoomIds.value.indexOf(id);
  if (idx !== -1) {
    selectedRoomIds.value.splice(idx, 1);
    errorMessage.value = ''; // ggf. vorherige "Max. erreicht"-Meldung aufräumen
    return;
  }

  if (maxReached.value) {
    errorMessage.value = `Es können maximal ${MAX_PRINTABLE_ROOMS} Räume gleichzeitig gedruckt werden.`;
    return;
  }

  errorMessage.value = '';
  selectedRoomIds.value.push(id);
}

function selectAllRooms() {
  const capped = props.rooms.length > MAX_PRINTABLE_ROOMS;
  selectedRoomIds.value = props.rooms
    .slice(0, MAX_PRINTABLE_ROOMS)
    .map((room) => room.id);
  errorMessage.value = capped
    ? `Es gibt ${props.rooms.length} Räume, es wurden aber nur die ersten ${MAX_PRINTABLE_ROOMS} ausgewählt (Druck-Limit).`
    : '';
}

function deselectAllRooms() {
  selectedRoomIds.value = [];
  errorMessage.value = '';
}

function handleClose() {
  if (loading.value) {
    return; // während des Druckvorgangs nicht schließbar
  }
  emit('close');
}

async function handlePrint() {
  if (selectedRoomIds.value.length === 0) {
    errorMessage.value = 'Bitte mindestens einen Raum auswählen.';
    return;
  }

  if (!printDate.value) {
    errorMessage.value = 'Bitte ein Datum auswählen.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const { downloadUrl } = await printCalendar({
      type: printType.value,
      date: printDate.value,
      roomIds: selectedRoomIds.value,
    });

    downloadFromUrl(downloadUrl);
    emit('close');
  } catch (err: any) {
    // Antwort ist jetzt normales JSON (kein Blob mehr nötig zu parsen,
    // da das Backend nur noch die Download-URL zurückgibt, nicht das PDF
    // selbst) — axios liefert Fehlermeldungen direkt als Objekt.
    errorMessage.value =
      err?.response?.data?.message ??
      'Der Kalender konnte nicht als PDF erzeugt werden. Bitte später erneut versuchen.';

    console.error('Fehler beim Drucken des Kalenders:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <CModal :visible="props.visible" @close="handleClose">
    <CModalHeader>
      <CModalTitle>Kalender drucken</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Ansicht</CFormLabel>
        <div class="btn-group w-100" role="group">
          <input
            type="radio"
            class="btn-check"
            id="print-type-week"
            value="week"
            v-model="printType"
            autocomplete="off"
          />
          <label class="btn btn-outline-primary" for="print-type-week"
            >Woche</label
          >

          <input
            type="radio"
            class="btn-check"
            id="print-type-month"
            value="month"
            v-model="printType"
            autocomplete="off"
          />
          <label class="btn btn-outline-primary" for="print-type-month"
            >Monat</label
          >

          <input
            type="radio"
            class="btn-check"
            id="print-type-year"
            value="year"
            v-model="printType"
            autocomplete="off"
          />
          <label class="btn btn-outline-primary" for="print-type-year"
            >Jahr</label
          >
        </div>
      </div>

      <div class="mb-3">
        <CFormInput
          id="print-modal-date"
          v-model="printDate"
          type="date"
          :label="`Datum innerhalb des zu druckenden ${typeLabel === 'Woche' ? 'Woche' : typeLabel === 'Monat' ? 'Monats' : 'Jahres'}`"
        />
      </div>

      <div class="mb-2 d-flex justify-content-between align-items-center">
        <CFormLabel class="mb-0">
          Räume
          <span class="text-muted small"
            >({{ selectedRoomIds.length }}/{{ MAX_PRINTABLE_ROOMS }})</span
          >
        </CFormLabel>
        <div>
          <CButton size="sm" color="link" @click="selectAllRooms">
            Alle auswählen
          </CButton>
          <CButton size="sm" color="link" @click="deselectAllRooms">
            Keinen auswählen
          </CButton>
        </div>
      </div>

      <div class="print-room-list">
        <div
          v-for="room in props.rooms"
          :key="room.id"
          class="print-room-list__item"
        >
          <CFormCheck
            :id="`print-room-${room.id}`"
            :model-value="selectedRoomIds.includes(room.id)"
            :disabled="maxReached && !selectedRoomIds.includes(room.id)"
            :label="room.title"
            @change="toggleRoom(room.id)"
          />
          <span
            class="print-room-list__dot"
            :style="{ background: room.color }"
          />
        </div>

        <p v-if="props.rooms.length === 0" class="text-muted mb-0">
          Keine Räume gefunden.
        </p>
      </div>

      <CAlert v-if="errorMessage" color="danger" class="mt-3 mb-0">
        {{ errorMessage }}
      </CAlert>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" :disabled="loading" @click="handleClose">
        Abbrechen
      </CButton>
      <CButton color="primary" :disabled="loading" @click="handlePrint">
        <CSpinner v-if="loading" size="sm" class="me-2" />
        {{ loading ? 'Wird erzeugt…' : 'Drucken' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<style scoped>
.print-room-list {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--cui-border-color, #d8dbe0);
  border-radius: 4px;
  padding: 8px 10px;
}

.print-room-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0;
}

.print-room-list__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
