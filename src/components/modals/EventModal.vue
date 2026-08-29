<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';

import type { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';
import type { RoomNames } from '@/helper/interfaces/room/RoomNames';

import { useEventForm } from '@/composables/useEventForm';
import { useAuthStore } from '@/stores/auth.store';
import { getRoomNames } from '@/api/getRoomNames';
import {
  CCol,
  CForm,
  CFormCheck,
  CFormLabel,
  CFormTextarea,
} from '@coreui/vue';
import { PrefillData } from '@/helper/interfaces/PrefillData';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { de } from 'date-fns/locale';

const props = defineProps<{
  visible: boolean;
  prefill?: PrefillData;
  event?: CalendarEvent | null;
  isEditing?: boolean;
  canEdit?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: any): void;
  (e: 'delete', id: string): void;
}>();

const {
  form,
  customDates,
  datesText,
  validated,

  showSeriesOptions,
  showCustomDates,

  addDateRow,
  removeDateRow,
  parseDatesFromText,
  seedFirstCustomDate,
  resetForm,
} = useEventForm();

const auth = useAuthStore();

// Kategorie "Gottesdienst" darf nur von Verwaltung/Admin gesetzt werden
const canManageCategory = computed(
  () =>
    auth.user?.role?.name === 'admin' || auth.user?.role?.name === 'verwaltung',
);

const roomNames = ref<RoomNames[]>([]);

onMounted(async () => {
  try {
    roomNames.value = await getRoomNames();
  } catch (err) {
    console.error(err);
  }
});

watch(
  () => props.prefill,
  (prefill) => {
    if (!prefill) {
      return;
    }

    form.value.isSeries = prefill.isSeries ?? false;
    form.value.frequency = prefill.frequency ?? 'WEEKLY';
    form.value.endSeriesDate = prefill.seriesEnd
      ? prefill.seriesEnd.split('T')[0]
      : '';
    form.value.runDuringSchoolHolidays =
      prefill.runDuringSchoolHolidays ?? false;
  },
  {
    immediate: true,
    deep: true,
  },
);

watch(
  () => props.event,
  (event) => {
    if (!event) {
      return;
    }

    form.value.title = event.title || '';
    form.value.description = event.description || '';
    form.value.startDate = event.start?.split('T')[0] || '';
    form.value.endDate = event.end?.split('T')[0] || '';
    form.value.room = event.roomId ? String(event.roomId) : '';

    if (event.start) {
      const startDate = new Date(event.start);

      form.value.startTime = startDate.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (event.end) {
      const endDate = new Date(event.end);

      form.value.endTime = endDate.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  },
  {
    immediate: true,
  },
);

function onCustomSeriesToggle(checked: boolean) {
  if (checked) {
    seedFirstCustomDate(form.value.startDate);
  }
  form.value.customSeries = checked;
}

// Startdatum → Enddatum vorausfüllen
watch(
  () => form.value.startDate,
  (newDate) => {
    if (!newDate) return;
    if (!form.value.endDate || form.value.endDate < newDate) {
      form.value.endDate = newDate;
    }
  },
);

// Startzeit → Endzeit +1 Stunde vorausfüllen
watch(
  () => form.value.startTime,
  (newTime) => {
    if (!newTime) return;
    const [hours, minutes] = newTime.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    form.value.endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  },
);

const dateError = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return '';
  if (form.value.endDate < form.value.startDate)
    return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
  return '';
});

const timeError = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return '';
  if (
    form.value.startDate === form.value.endDate &&
    form.value.endTime <= form.value.startTime
  ) {
    return 'Die Endzeit darf nicht vor oder gleich der Startzeit liegen.';
  }
  return '';
});

// Liefert den Monat/Startpunkt, den der Datepicker einer "Zusätzliche Termine"-
// Zeile beim Öffnen anzeigen soll: das Datum der vorherigen Zeile, falls
// vorhanden – ohne dass dabei ein Datum in der aktuellen Zeile vorausgewählt wird.
function startDateFor(index: number): Date | undefined {
  const previous = customDates.value[index - 1];
  if (!previous || !previous.value) {
    return undefined;
  }
  return new Date(previous.value);
}

// Datum, das als "kein Enddatum" für Serien verwendet wird (Workaround,
// bis das Backend echte unbefristete Serien unterstützt). Ist das Serienende
// gleich diesem Sentinel-Wert, wird das Feld "Wiederholen bis zum" nicht
// angezeigt.
const NO_END_DATE_SENTINEL = '2050-12-31';

const showEndSeriesDateField = computed(
  () => form.value.endSeriesDate !== NO_END_DATE_SENTINEL,
);

function closeModal() {
  emit('close');
  resetForm();
}

function handleSubmit() {
  validated.value = true;

  const el = document.getElementById('eventModalForm');
  if (el && !(el as HTMLFormElement).checkValidity()) return;
  if (dateError.value || timeError.value) return;

  // Ist das eine benutzerdefinierte Terminserie (feste Einzeltermine statt Wiederholungsmuster)?
  const isCustomSeries = form.value.isSeries && form.value.customSeries;

  // Wenn die Serie kein Enddatum hat, Sentinel-Datum setzen,
  // damit die Serie im Backend als "endlos" behandelt wird.
  // Gilt nur für die normale Wiederholung, nicht für benutzerdefinierte Einzeltermine.
  const endSeriesDate =
    form.value.isSeries && !isCustomSeries && !form.value.endSeriesDate
      ? NO_END_DATE_SENTINEL
      : form.value.endSeriesDate;

  // Kategorie: "Gottesdienst" (2) nur, wenn von Verwaltung/Admin gesetzt, sonst "Standard" (1)
  const categoryid = canManageCategory.value && form.value.isGottesdienst ? 2 : 1;

  // Alle Daten sammeln
  const dates: string[] = [];

  // Hauptdatum immer hinzufügen
  if (form.value.startDate) {
    dates.push(form.value.startDate);
  }

  // Benutzerdefinierte Zusatztermine hinzufügen, falls aktiv
  if (isCustomSeries) {
    customDates.value.forEach((entry) => {
      if (entry.value && !dates.includes(entry.value)) {
        dates.push(entry.value);
      }
    });
  }

  // Für jedes Datum einen eigenen Payload erstellen
  const payloads = dates.map((date) => {
    // Bei mehrtägigen Terminen: Enddatum relativ zum jeweiligen Startdatum berechnen
    const dayDiff =
      form.value.endDate && form.value.startDate
        ? (new Date(form.value.endDate).getTime() -
            new Date(form.value.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
        : 0;

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + dayDiff);
    const endDateStr = endDate.toISOString().split('T')[0];

    const start = `${date}T${form.value.startTime}:00`;
    const end = `${endDateStr}T${form.value.endTime}:00`;

    if (isCustomSeries) {
      // Jeder benutzerdefinierte Termin ist ein eigenständiges Einzelevent,
      // es wird KEIN Backend-Series-Objekt (WEEKLY/BIWEEKLY) erzeugt.
      return {
        id: props.event?.id ? Number(props.event.id) : 0,
        title: form.value.title.trim(),
        start,
        end,
        allDay: false,
        description: form.value.description.trim(),
        roomid: Number(form.value.room),
        categoryid,
        isSeries: false,
      };
    }

    return {
      id: props.event?.id ? Number(props.event.id) : 0,
      title: form.value.title.trim(),
      start,
      end,
      allDay: false,
      description: form.value.description.trim(),
      roomid: Number(form.value.room),
      categoryid,
      isSeries: form.value.isSeries,
      frequency: form.value.frequency,
      endSeriesDate,
      runDuringSchoolHolidays: form.value.runDuringSchoolHolidays,
    };
  });

  // Genau ein Termin -> wie bisher ein einzelnes Objekt emittieren.
  // Mehrere Termine (benutzerdefinierte Zusatztermine) -> als Array emittieren.
  emit('save', payloads.length === 1 ? payloads[0] : payloads);
}

function handleDelete() {
  if (!props.event?.id) return;
  emit('delete', props.event.id);
  closeModal();
}
</script>

<template>
  <CModal :visible="visible" size="lg" backdrop="static" @close="closeModal">
    <CModalHeader>
      <CModalTitle>
        <CIcon name="cil-calendar" class="me-2" />
        {{ isEditing ? 'Veranstaltung bearbeiten' : 'Veranstaltung erstellen' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CAlert v-if="errorMessage" color="danger" class="mb-3">
        <strong>Termin konnte nicht gespeichert werden</strong>
        <div style="white-space: pre-line">{{ errorMessage }}</div>
      </CAlert>
      <CForm
        id="eventModalForm"
        novalidate
        :class="{ 'was-validated': validated }"
        @submit.prevent="handleSubmit"
      >
        <!-- Titel -->
        <CRow class="mb-3">
          <CCol>
            <CFormLabel>Titel</CFormLabel>

            <CFormInput v-model="form.title" required :disabled="!canEdit" />
          </CCol>
        </CRow>

        <!-- Beschreibung -->
        <CRow class="mb-3">
          <CCol>
            <CFormLabel>Beschreibung</CFormLabel>

            <CFormInput
              v-model="form.description"
              rows="4"
              :disabled="!canEdit"
            />
          </CCol>
        </CRow>
        <!-- Ersteller (nur bei bestehendem Termin) -->
        <CRow v-if="isEditing && event?.userName" class="mb-3">
          <CCol>
            <CFormLabel>Erstellt von</CFormLabel>
            <CFormInput :model-value="event.userName" disabled />
          </CCol>
        </CRow>

        <!-- Raum -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel>Raum</CFormLabel>
            <CFormSelect v-model="form.room" required :disabled="!canEdit">
              <option value="">Bitte wählen</option>
              <option
                v-for="room in roomNames"
                :key="room.id"
                :value="String(room.id)"
              >
                {{ room.title }}
              </option>
            </CFormSelect>
          </CCol>
        </CRow>

        <!-- Kategorie: Gottesdienst (nur für Verwaltung/Admin) -->
        <CRow class="mb-3" v-if="canManageCategory">
          <CCol>
            <CFormCheck
              id="event-modal-is-gottesdienst"
              v-model="form.isGottesdienst"
              label="Gottesdienst"
              :disabled="!canEdit"
            />
          </CCol>
        </CRow>

        <!-- Uhrzeit -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel>Startzeit</CFormLabel>
            <CFormInput
              v-model="form.startTime"
              type="time"
              required
              :disabled="!canEdit"
            />
          </CCol>

          <CCol md="6">
            <CFormLabel>Endzeit</CFormLabel>
            <CFormInput
              v-model="form.endTime"
              type="time"
              required
              :invalid="validated && !!timeError"
              :disabled="!canEdit"
            />
            <CFormFeedback invalid>{{ timeError }}</CFormFeedback>
          </CCol>
        </CRow>

        <!-- Datum: bei benutzerdefinierten Terminen ausgeblendet, da das Startdatum
             dann direkt in die erste Zeile der Zusätzliche-Termine-Liste übernommen wird -->
        <CRow class="mb-3" v-if="!form.customSeries">
          <CCol md="6">
            <CFormLabel>Startdatum</CFormLabel>
            <VueDatePicker
              v-model="form.startDate"
              model-type="yyyy-MM-dd"
              :start-date="new Date()"
              :time-config="{ enableTimePicker: false }"
              auto-apply
              :disabled="!canEdit"
              placeholder="Datum wählen"
              :locale="de"
              :formats="{ input: 'dd.MM.yyyy' }"
              six-weeks="center"
            />
          </CCol>

          <CCol md="6">
            <CFormLabel>Enddatum</CFormLabel>
            <VueDatePicker
              v-model="form.endDate"
              model-type="yyyy-MM-dd"
              :start-date="new Date()"
              :min-date="form.startDate || undefined"
              :time-config="{ enableTimePicker: false }"
              auto-apply
              :disabled="!canEdit"
              placeholder="Datum wählen"
              :locale="de"
              :formats="{ input: 'dd.MM.yyyy' }"
              six-weeks="center"
              :input-attrs="{
                state: validated && !!dateError ? false : undefined,
              }"
            />
            <CFormFeedback
              invalid
              :class="{ 'd-block': validated && !!dateError }"
              >{{ dateError }}</CFormFeedback
            >
          </CCol>
        </CRow>
        <!-- Serie -->
        <!-- Serie: im Bearbeiten-Modus nur anzeigen, wenn der Termin tatsächlich Teil einer Serie ist -->
        <CRow class="mb-3" v-if="!isEditing || form.isSeries">
          <CCol>
            <CFormCheck
              id="event-modal-isseries"
              v-model="form.isSeries"
              label="Termin ist Teil einer Serie"
              :disabled="!canEdit"
            />
          </CCol>
        </CRow>

        <CCollapse :visible="showSeriesOptions">
          <CCard class="mb-3 series-options-card">
            <CCardBody>
              <!-- Standard-Wiederholung: nur sichtbar, wenn NICHT benutzerdefiniert -->
              <div v-if="!form.customSeries">
                <div class="series-section-label">Wiederholung</div>

                <CRow class="mb-3">
                  <CCol md="6" v-if="showEndSeriesDateField">
                    <CFormLabel>Wiederholen bis zum</CFormLabel>
                    <CFormInput
                      v-model="form.endSeriesDate"
                      type="date"
                      :disabled="!canEdit"
                    />
                  </CCol>

                  <CCol :md="showEndSeriesDateField ? 6 : 12">
                    <CFormLabel>Wiederholung</CFormLabel>
                    <CFormSelect v-model="form.frequency" :disabled="!canEdit">
                      <option value="WEEKLY">Wöchentlich</option>
                      <option value="BIWEEKLY">Zweiwöchentlich</option>
                    </CFormSelect>
                  </CCol>
                </CRow>

                <CFormCheck
                  id="event-modal-run-during-holidays"
                  v-model="form.runDuringSchoolHolidays"
                  label="Termine finden auch während der Ferien statt"
                  :disabled="!canEdit"
                />

                <hr class="series-divider" />
              </div>

              <CFormCheck
                id="event-modal-custom-series"
                v-if="!isEditing"
                :model-value="form.customSeries"
                label="Benutzerdefiniert (feste Einzeltermine statt Wiederholungsmuster)"
                :disabled="!canEdit"
                @update:model-value="onCustomSeriesToggle"
              />
            </CCardBody>
          </CCard>
        </CCollapse>

        <!-- Benutzerdefinierte Einzeltermine -->
        <CCollapse :visible="showCustomDates">
          <CCard class="mb-3 series-options-card">
            <CCardBody>
              <div class="series-section-label">Benutzerdefinierte Termine</div>

              <div
                v-for="(entry, index) in customDates"
                :key="entry.id"
                class="d-flex align-items-center gap-2 mb-2"
              >
                <VueDatePicker
                  v-model="entry.value"
                  :start-date="startDateFor(index)"
                  model-type="yyyy-MM-dd"
                  :time-config="{ enableTimePicker: false }"
                  auto-apply
                  :disabled="!canEdit"
                  placeholder="Datum wählen"
                  :locale="de"
                  :formats="{ input: 'dd.MM.yyyy' }"
                  six-weeks="center"
                  class="flex-grow-1"
                />

                <CButton
                  type="button"
                  color="danger"
                  variant="outline"
                  size="sm"
                  :disabled="!canEdit"
                  @click="removeDateRow(entry.id)"
                >
                  X
                </CButton>
              </div>

              <CButton
                type="button"
                color="primary"
                variant="outline"
                size="sm"
                class="mb-4"
                :disabled="!canEdit"
                @click="addDateRow()"
              >
                + Datum
              </CButton>

              <hr class="series-divider" />

              <CFormLabel>Mehrere Termine per Text einfügen</CFormLabel>
              <div class="series-hint">
                Ein Datum pro Zeile oder durch Komma/Semikolon getrennt, Format
                (z. B. 12.08.2026 oder 5.8.26)
              </div>

              <CFormTextarea
                v-model="datesText"
                rows="3"
                :disabled="!canEdit"
              />

              <CButton
                type="button"
                color="secondary"
                variant="outline"
                size="sm"
                class="mt-2"
                :disabled="!canEdit"
                @click="parseDatesFromText"
              >
                Daten hinzufügen
              </CButton>
            </CCardBody>
          </CCard>
        </CCollapse>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeModal">
        Abbrechen
      </CButton>

      <CButton v-if="isEditing && canEdit" color="danger" @click="handleDelete">
        Löschen
      </CButton>

      <CButton v-if="canEdit" color="primary" @click="handleSubmit">
        Speichern
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<style scoped>
.series-options-card {
  border: 1px solid var(--cui-border-color, #d8dbe0);
  border-radius: 0.5rem;
}

.series-section-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cui-secondary-color, #6b7785);
  margin-bottom: 0.75rem;
}

.series-hint {
  font-size: 0.8125rem;
  color: var(--cui-secondary-color, #6b7785);
  margin-bottom: 0.5rem;
}

.series-divider {
  margin: 1rem 0;
  border-top: 1px solid var(--cui-border-color, #d8dbe0);
  opacity: 1;
}
</style>
