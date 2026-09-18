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

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** ISO-8601-Kalenderwoche (Montag als Wochenbeginn) für ein Datum. */
function dateToIsoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function dateToWeekInputValue(date: Date): string {
  const { year, week } = dateToIsoWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Montag der übergebenen ISO-Kalenderwoche, als "YYYY-MM-DD". */
function weekInputValueToIsoDate(value: string): string {
  const [yearStr, weekStr] = value.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);

  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const monday = new Date(simple);
  if (dayOfWeek <= 4) {
    monday.setDate(simple.getDate() - dayOfWeek + 1);
  } else {
    monday.setDate(simple.getDate() + 8 - dayOfWeek);
  }

  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** Jahre für die Dropdowns: von `back` Jahren in der Vergangenheit bis
 *  `forward` Jahre in der Zukunft, ausgehend vom übergebenen Jahr. */
function yearRange(center: number, back: number, forward: number): number[] {
  const years: number[] = [];
  for (let y = center + forward; y >= center - back; y--) {
    years.push(y);
  }
  return years;
}

const printType = ref<PrintViewType>('week');
const selectedRoomIds = ref<number[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const referenceDate = computed(() =>
  parseIsoDate(props.initialDate || today()),
);

const weekValue = ref<string>(dateToWeekInputValue(referenceDate.value));
const monthValue = ref<number>(referenceDate.value.getMonth() + 1);
const monthYearValue = ref<number>(referenceDate.value.getFullYear());
const yearOnlyValue = ref<number>(referenceDate.value.getFullYear());

const yearOptions = computed(() =>
  yearRange(referenceDate.value.getFullYear(), 0, 5),
);

const WEEK_OPTIONS_COUNT = 30;

/** Aktuelle Woche (bezogen auf referenceDate) plus die folgenden 29 Wochen,
 *  jeweils mit Kalenderwoche und Zeitraum (Montag - Sonntag) als Label.
 *  Ersetzt den nativen input[type=week], der in Firefox nicht unterstützt wird. */
const weekOptions = computed(() => {
  const firstMonday = parseIsoDate(
    weekInputValueToIsoDate(dateToWeekInputValue(referenceDate.value)),
  );

  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < WEEK_OPTIONS_COUNT; i++) {
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + i * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const { week } = dateToIsoWeek(monday);
    options.push({
      value: dateToWeekInputValue(monday),
      label: `KW ${String(week).padStart(2, '0')} (${formatShortDate(monday)} - ${formatShortDate(sunday)})`,
    });
  }
  return options;
});

/** Das an das Backend zu übergebende ISO-Datum, je nach gewählter Ansicht. */
const printDate = computed<string>(() => {
  if (printType.value === 'week') {
    return weekValue.value ? weekInputValueToIsoDate(weekValue.value) : '';
  }
  if (printType.value === 'month') {
    return `${monthYearValue.value}-${String(monthValue.value).padStart(2, '0')}-01`;
  }
  return `${yearOnlyValue.value}-01-01`;
});

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
      const refDate = referenceDate.value;
      weekValue.value = dateToWeekInputValue(refDate);
      monthValue.value = refDate.getMonth() + 1;
      monthYearValue.value = refDate.getFullYear();
      yearOnlyValue.value = refDate.getFullYear();
      selectedRoomIds.value = props.rooms
        .slice(0, MAX_PRINTABLE_ROOMS)
        .map((room) => room.id);
      errorMessage.value = '';
    }
  },
);

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
        <template v-if="printType === 'week'">
          <CFormLabel for="print-modal-week">Woche</CFormLabel>
          <!-- Native select statt CFormSelect: dessen "size"-Prop steuert nur
               die Bootstrap-Größe (sm/lg), nicht die Anzahl sichtbarer Zeilen -
               die braucht das native size-Attribut, daher hier form-select
               händisch statt der Komponente. -->
          <select
            id="print-modal-week"
            v-model="weekValue"
            size="6"
            class="form-select"
          >
            <option v-for="opt in weekOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>

        <template v-else-if="printType === 'month'">
          <CFormLabel>Monat und Jahr</CFormLabel>
          <div class="d-flex gap-2">
            <CFormSelect
              id="print-modal-month"
              v-model.number="monthValue"
              class="flex-grow-1"
            >
              <option v-for="(name, idx) in MONTH_NAMES" :key="idx" :value="idx + 1">
                {{ name }}
              </option>
            </CFormSelect>
            <CFormSelect
              id="print-modal-month-year"
              v-model.number="monthYearValue"
              class="print-modal-year-select"
            >
              <option v-for="year in yearOptions" :key="year" :value="year">
                {{ year }}
              </option>
            </CFormSelect>
          </div>
        </template>

        <template v-else>
          <CFormSelect
            id="print-modal-year"
            v-model.number="yearOnlyValue"
            label="Jahr"
            class="print-modal-year-select"
          >
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </CFormSelect>
        </template>
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

.print-modal-year-select {
  max-width: 120px;
}
</style>
