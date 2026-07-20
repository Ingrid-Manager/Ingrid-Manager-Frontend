<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getResourceNames } from '@/api/getResourceNames';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { de } from 'date-fns/locale';

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  visible: boolean;
  isEditing?: boolean;
  canEdit?: boolean;
  errorMessage?: string;
  prefill?: {
    start?: string;
    end?: string;
  };
  event?: {
    id: string;
    title: string;
    start: string;
    end?: string;
    resourceId?: number;
    resourceTitle?: string;
    userId?: number;
    userName?: string;
  } | null;
}>();

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', event: BookingPayload): void;
  (e: 'delete', id: string): void;
}>();

// ─── Typen ────────────────────────────────────────────────────────────────────
export interface BookingPayload {
  id: string;
  title: string;
  start: string;
  end?: string;
  description: string;
  resource: string;
  color: string;
}

// ─── Ressourcen laden ─────────────────────────────────────────────────────────
const resources = ref<ResourceNames[]>([]);

onMounted(async () => {
  try {
    resources.value = await getResourceNames();
  } catch (err) {
    console.error('Fehler beim Laden der Ressourcen:', err);
  }
});

// ─── Formular-State ───────────────────────────────────────────────────────────
const form = ref({
  'create-ressource-modal-description': '',
  'create-ressource-modal-resource': '',
  'create-ressource-modal-start': '',
  'create-ressource-modal-end': '',
});

const validated = ref(false);

// ─── Event vorausfüllen beim Bearbeiten ───────────────────────────────────────
watch(
  () => props.event,
  (event) => {
    if (!event) return;
    form.value['create-ressource-modal-description'] = event.title || '';
    form.value['create-ressource-modal-resource'] = event.resourceId
      ? String(event.resourceId)
      : '';
    form.value['create-ressource-modal-start'] =
      event.start?.split('T')[0] || '';
    form.value['create-ressource-modal-end'] = event.end?.split('T')[0] || '';
  },
  { immediate: true },
);

// ─── Prefill beim Erstellen ───────────────────────────────────────────────────
watch(
  () => props.prefill,
  (prefill) => {
    if (!prefill || props.isEditing) return;
    if (prefill.start)
      form.value['create-ressource-modal-start'] = prefill.start;
    if (prefill.end) form.value['create-ressource-modal-end'] = prefill.end;
  },
  { immediate: true },
);

// ─── Startdatum-Handler: End automatisch auf Start + 1 Tag setzen ─────────────
function onStartChange() {
  const start = form.value['create-ressource-modal-start'];
  if (!start) return;

  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().slice(0, 10);

  const currentEnd = form.value['create-ressource-modal-end'];
  if (!currentEnd || currentEnd < start) {
    form.value['create-ressource-modal-end'] = nextDayStr;
  }
}

// ─── Validierung ──────────────────────────────────────────────────────────────
const endDateInvalid = computed(
  () =>
    !!(
      form.value['create-ressource-modal-end'] &&
      form.value['create-ressource-modal-end'] <
        form.value['create-ressource-modal-start']
    ),
);

// ─── Gewählte Ressource (für Farbe im Payload) ────────────────────────────────
const selectedResource = computed(() =>
  resources.value.find(
    (r) => String(r.id) === form.value['create-ressource-modal-resource'],
  ),
);

// ─── Öffentliche Methode: Datum vorausfüllen (via defineExpose) ───────────────
function prefillDates(start: string, end: string) {
  form.value['create-ressource-modal-start'] = start;
  form.value['create-ressource-modal-end'] = end;
}

defineExpose({ prefillDates });

// ─── Submit ───────────────────────────────────────────────────────────────────
function handleSubmit() {
  validated.value = true;

  const formEl = document.getElementById('resourceBookingForm');
  if (formEl && !(formEl as HTMLFormElement).checkValidity()) return;
  if (endDateInvalid.value) return;
  if (!form.value['create-ressource-modal-description'].trim()) return;
  if (!form.value['create-ressource-modal-resource']) return;
  if (!form.value['create-ressource-modal-start']) return;

  const payload: BookingPayload = {
    id: props.event?.id ?? String(Date.now()),
    title: form.value['create-ressource-modal-description'].trim(),
    start: form.value['create-ressource-modal-start'],
    end: form.value['create-ressource-modal-end'] || undefined,
    description: form.value['create-ressource-modal-description'].trim(),
    resource: form.value['create-ressource-modal-resource'],
    color: selectedResource.value?.color ?? '#321fdb',
  };

  emit('saved', payload);
  handleClose();
}

// ─── Löschen ──────────────────────────────────────────────────────────────────
function handleDelete() {
  if (!props.event?.id) return;
  emit('delete', props.event.id);
  handleClose();
}

// ─── Schließen / Reset ────────────────────────────────────────────────────────
function handleClose() {
  emit('close');
  resetForm();
}

function resetForm() {
  form.value = {
    'create-ressource-modal-description': '',
    'create-ressource-modal-resource': '',
    'create-ressource-modal-start': '',
    'create-ressource-modal-end': '',
  };
  validated.value = false;
}
</script>

<template>
  <CModal
    :visible="props.visible"
    size="lg"
    backdrop="static"
    @close="handleClose"
  >
    <CModalHeader>
      <CModalTitle>
        <CIcon name="cil-calendar" class="me-2" />
        {{ isEditing ? 'Buchung bearbeiten' : 'Ressource buchen' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <!-- Fehlermeldung -->
      <CAlert v-if="errorMessage" color="danger" class="mb-3">
        <strong>Buchung konnte nicht gespeichert werden</strong>
        <div>{{ errorMessage }}</div>
      </CAlert>

      <CForm
        id="resourceBookingForm"
        :class="{ 'was-validated': validated }"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <!-- ── Beschreibung / Titel ── -->
        <CRow class="mb-3">
          <CCol>
            <CFormLabel for="create-ressource-modal-description">
              Beschreibung
            </CFormLabel>
            <CFormInput
              id="create-ressource-modal-description"
              v-model="form['create-ressource-modal-description']"
              placeholder="Kurze Beschreibung"
              required
              :disabled="!canEdit"
              :invalid="
                validated && !form['create-ressource-modal-description'].trim()
              "
            />
            <CFormFeedback invalid>
              Bitte eine Beschreibung eingeben.
            </CFormFeedback>
          </CCol>
        </CRow>

        <!-- ── Erstellt von (nur beim Bearbeiten) ── -->
        <CRow v-if="isEditing && event?.userName" class="mb-3">
          <CCol>
            <CFormLabel>Gebucht von</CFormLabel>
            <CFormInput :model-value="event.userName" disabled />
          </CCol>
        </CRow>

        <!-- ── Ressource ── -->
        <CRow class="mb-3">
          <CCol>
            <CFormLabel for="create-ressource-modal-resource">
              Ressource
            </CFormLabel>
            <CFormSelect
              id="create-ressource-modal-resource"
              v-model="form['create-ressource-modal-resource']"
              required
              :disabled="!canEdit"
              :invalid="validated && !form['create-ressource-modal-resource']"
            >
              <option value="">— auswählen —</option>
              <option
                v-for="resource in resources"
                :key="resource.id"
                :value="String(resource.id)"
              >
                {{ resource.title }}
              </option>
            </CFormSelect>
            <CFormFeedback invalid>
              Bitte eine Ressource auswählen.
            </CFormFeedback>
          </CCol>
        </CRow>

        <!-- ── Start- und Enddatum ── -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel for="create-ressource-modal-start">
              Startdatum
            </CFormLabel>
            <VueDatePicker
              id="create-ressource-modal-start"
              v-model="form['create-ressource-modal-start']"
              model-type="yyyy-MM-dd"
              :start-date="new Date()"
              :time-config="{ enableTimePicker: false }"
              auto-apply
              :disabled="!canEdit"
              placeholder="Datum wählen"
              :locale="de"
              :formats="{ input: 'dd.MM.yyyy' }"
              six-weeks="center"
              :input-attrs="{
                state:
                  validated && !form['create-ressource-modal-start']
                    ? false
                    : undefined,
              }"
              @update:model-value="onStartChange"
            />
            <CFormFeedback
              invalid
              :class="{
                'd-block': validated && !form['create-ressource-modal-start'],
              }"
            >
              Pflichtfeld.
            </CFormFeedback>
          </CCol>

          <CCol md="6">
            <CFormLabel for="create-ressource-modal-end"> Enddatum </CFormLabel>
            <VueDatePicker
              id="create-ressource-modal-end"
              v-model="form['create-ressource-modal-end']"
              model-type="yyyy-MM-dd"
              :start-date="new Date()"
              :min-date="form['create-ressource-modal-start'] || undefined"
              :time-config="{ enableTimePicker: false }"
              auto-apply
              :disabled="!canEdit"
              placeholder="Datum wählen"
              :locale="de"
              :formats="{ input: 'dd.MM.yyyy' }"
              six-weeks="center"
              :input-attrs="{
                state: validated && endDateInvalid ? false : undefined,
              }"
            />
            <CFormFeedback
              invalid
              :class="{ 'd-block': validated && endDateInvalid }"
            >
              Das Enddatum darf nicht vor dem Startdatum liegen.
            </CFormFeedback>
          </CCol>
        </CRow>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="handleClose">
        Abbrechen
      </CButton>

      <CButton v-if="isEditing && canEdit" color="danger" @click="handleDelete">
        Löschen
      </CButton>

      <CButton v-if="canEdit" color="primary" @click="handleSubmit">
        {{ isEditing ? 'Speichern' : 'Buchung speichern' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>
