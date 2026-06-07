<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';

import type { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';
import type { RoomNames } from '@/helper/interfaces/room/RoomNames';
import { buildRRule } from '@/helper/calendar/buildRRule';

import { useEventForm } from '@/composables/useEventForm';
import { getRoomNames } from '@/api/getRoomNames';
import { CForm, CFormLabel } from '@coreui/vue';

const props = defineProps<{
  visible: boolean;
  prefill?: {
    startDate?: string;
    endDate?: string;
  };
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
  validated,

  showSeriesOptions,
  resetForm,
} = useEventForm();

const roomNames = ref<RoomNames[]>([]);

onMounted(async () => {
  try {
    roomNames.value = await getRoomNames();
  } catch (err) {
    console.error(err);
  }
});

/* watch(
  () => props.visible,
  (visible) => {
    if (visible && props.prefill) {
      form.value.startDate = props.prefill.startDate || ''
      form.value.endDate = props.prefill.endDate || ''
    }
  },
) */

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

// Startdatum → Enddatum vorausfüllen
watch(() => form.value.startDate, (newDate) => {
  if (!newDate) return;
  if (!form.value.endDate || form.value.endDate < newDate) {
    form.value.endDate = newDate;
  }
});

// Startzeit → Endzeit +1 Stunde vorausfüllen
watch(() => form.value.startTime, (newTime) => {
  if (!newTime) return;
  const [hours, minutes] = newTime.split(':').map(Number);
  const endHour = (hours + 1) % 24;
  form.value.endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const dateError = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return '';
  if (form.value.endDate < form.value.startDate) return 'Das Enddatum darf nicht vor dem Startdatum liegen.';
  return '';
});

const timeError = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return '';
  if (form.value.startDate === form.value.endDate && form.value.endTime <= form.value.startTime) {
    return 'Die Endzeit darf nicht vor oder gleich der Startzeit liegen.';
  }
  return '';
});

function closeModal() {
  emit('close');
  resetForm();
}

function handleSubmit() {

  validated.value = true;

  const el = document.getElementById('eventModalForm');
  if (el && !(el as HTMLFormElement).checkValidity()) return;
  if (dateError.value || timeError.value) return;

  // Alle Daten sammeln
  const dates: string[] = [];

  // Hauptdatum immer hinzufügen
  if (form.value.startDate) {
    dates.push(form.value.startDate);
  }

  // Für jedes Datum einen eigenen Payload erstellen und emittieren
  dates.forEach((date) => {
    // Bei mehrtägigen Terminen: Enddatum relativ zum jeweiligen Startdatum berechnen
    const dayDiff =
      form.value.endDate && form.value.startDate
        ? (new Date(form.value.endDate).getTime() - new Date(form.value.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
        : 0;

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + dayDiff);
    const endDateStr = endDate.toISOString().split('T')[0];

    const start = `${date}T${form.value.startTime}:00`;
    const end = `${endDateStr}T${form.value.endTime}:00`;

    // Kein rrule bei customSeries – jeder Termin ist einzeln
    let rrule: string | undefined;
    if (form.value.isSeries && form.value.endSeriesDate) {
      rrule = buildRRule(
        form.value.repeatType,
        form.value.endSeriesDate,
      );
    }

    const payload = {
      id: props.event?.id ? Number(props.event.id) : 0,
      title: form.value.title.trim(),
      start,
      end,
      allDay: false,
      description: form.value.description.trim(),
      roomid: Number(form.value.room),
      categoryid: 1,
      rrule,
    };

    emit('save', payload);
  });
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
      <CAlert
        v-if="errorMessage"
        color="danger"
        class="mb-3"
      >
        <strong>Termin konnte nicht gespeichert werden</strong>
        <div>{{ errorMessage }}</div>
      </CAlert>
      <CForm id="eventModalForm" novalidate :class="{ 'was-validated': validated }" @submit.prevent="handleSubmit">
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

            <CFormInput v-model="form.description" rows="4" :disabled="!canEdit" />
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
            <CFormSelect v-model="form.room" required>
              <option value="">Bitte wählen</option>
              <option v-for="room in roomNames" :key="room.id" :value="String(room.id)">
                {{ room.title }}
              </option>
            </CFormSelect>
          </CCol>
        </CRow>

        <!-- Uhrzeit -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel>Startzeit</CFormLabel>
            <CFormInput v-model="form.startTime" type="time" required />
          </CCol>

          <CCol md="6">
            <CFormLabel>Endzeit</CFormLabel>
            <CFormInput v-model="form.endTime" type="time" required :invalid="validated && !!timeError" />
            <CFormFeedback invalid>{{ timeError }}</CFormFeedback>
          </CCol>
        </CRow>

        <!-- Datum -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel>Startdatum</CFormLabel>
            <CFormInput v-model="form.startDate" type="date" required />
          </CCol>

          <CCol md="6">
            <CFormLabel>Enddatum</CFormLabel>
            <CFormInput v-model="form.endDate" type="date" :min="form.startDate || undefined"
              :invalid="validated && !!dateError" />
            <CFormFeedback invalid>{{ dateError }}</CFormFeedback>
          </CCol>
        </CRow>
        <!-- Serie -->
        <CRow class="mb-3">
          <CCol>
            <CFormCheck v-model="form.isSeries" label="Termin ist Teil einer Serie" />
          </CCol>
        </CRow>

        <CCollapse :visible="showSeriesOptions">
          <CCard class="mb-3">
            <CCardBody>
              <CFormLabel>Wiederholen bis</CFormLabel>
              <CFormInput v-model="form.endSeriesDate" type="date" class="mb-3" />
              <CFormLabel>Wiederholungen</CFormLabel>
              <CFormSelect v-model="form.repeatType">
                <option value="">Keine Wiederholung</option>
                <option value="weekly">Wöchentlich</option>
                <option value="biweekly">14-tägig</option>
                <option value="monthly">Monatlich</option>
              </CFormSelect>
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
