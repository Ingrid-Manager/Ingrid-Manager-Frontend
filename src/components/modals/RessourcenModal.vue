<script setup lang="ts">
import { ref, computed } from 'vue';

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  visible: boolean;
}>();

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', event: BookingPayload): void;
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

// ─── Formular-State ───────────────────────────────────────────────────────────
const form = ref({
  'create-ressource-modal-description': '',
  'create-ressource-modal-resource': '',
  'create-ressource-modal-start': '',
  'create-ressource-modal-end': '',
});

const validated = ref(false);

// ─── Startdatum-Handler: End automatisch auf Start + 1 Tag setzen ─────────────
function onStartChange() {
  const start = form.value['create-ressource-modal-start'];
  if (!start) return;

  // End auf Start + 1 Tag vorausfüllen (überschreibt nur, wenn leer ODER vor neuem Start)
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
    id: String(Date.now()),
    title: form.value['create-ressource-modal-resource'],
    start: form.value['create-ressource-modal-start'],
    end: form.value['create-ressource-modal-end'] || undefined,
    description: form.value['create-ressource-modal-description'].trim(),
    resource: form.value['create-ressource-modal-resource'],
    color: '#321fdb',
  };

  emit('saved', payload);
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
        Ressource buchen
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CForm
        id="resourceBookingForm"
        :class="{ 'was-validated': validated }"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <!-- ── Beschreibung ── -->
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
              :invalid="
                validated && !form['create-ressource-modal-description'].trim()
              "
            />
            <CFormFeedback invalid
              >Bitte eine Beschreibung eingeben.</CFormFeedback
            >
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
              :invalid="validated && !form['create-ressource-modal-resource']"
            >
              <option value="">— auswählen —</option>
              <option value="Beamer">Beamer</option>
              <option value="Auto">Auto</option>
              <option value="Floorspots">Floorspots</option>
              <option value="Moderationskoffer">Moderationskoffer</option>
            </CFormSelect>
            <CFormFeedback invalid
              >Bitte eine Ressource auswählen.</CFormFeedback
            >
          </CCol>
        </CRow>

        <!-- ── Start- und Enddatum ── -->
        <CRow class="mb-3">
          <CCol md="6">
            <CFormLabel for="create-ressource-modal-start">
              Startdatum
            </CFormLabel>
            <CFormInput
              id="create-ressource-modal-start"
              v-model="form['create-ressource-modal-start']"
              type="date"
              required
              :invalid="validated && !form['create-ressource-modal-start']"
              @change="onStartChange"
            />
            <CFormFeedback invalid>Pflichtfeld.</CFormFeedback>
          </CCol>

          <CCol md="6">
            <CFormLabel for="create-ressource-modal-end"> Enddatum </CFormLabel>
            <CFormInput
              id="create-ressource-modal-end"
              v-model="form['create-ressource-modal-end']"
              type="date"
              required
              :min="form['create-ressource-modal-start'] || undefined"
              :invalid="validated && endDateInvalid"
            />
            <CFormFeedback invalid> Pflichtfeld </CFormFeedback>
          </CCol>
        </CRow>
      </CForm>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="handleClose">
        Abbrechen
      </CButton>
      <CButton color="primary" @click="handleSubmit">
        Buchung speichern
      </CButton>
    </CModalFooter>
  </CModal>
</template>
