<script setup lang="ts">
import { ref } from 'vue';
import { cilPlus, cilCheckCircle } from '@coreui/icons';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormFeedback,
  CRow,
  CCol,
  CTabs,
  CTabList,
  CTab,
  CTabContent,
  CTabPanel,
} from '@coreui/vue';
import CIcon from '@coreui/icons-vue';

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  visible: boolean;
}>();

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', row: WorshipEventRow): void;
  (e: 'file-uploaded', file: File): void;
}>();

// ─── Typen ────────────────────────────────────────────────────────────────────
export interface WorshipEventRow {
  datum: string;
  startTime: string;
  endTime: string;
  art: string;
  orgel: string;
  lesung: string;
  kirchenkaffee: string;
  kuester: string;
  kvAbkuendigung: string;
  kvSammeldienst: string;
  predigt: string;
  besonderheiten: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
const activeTab = ref<'termin' | 'upload'>('termin');
const validated = ref(false);
const uploadedFile = ref<File | null>(null);

const emptyForm = (): Record<string, string> => ({
  'create-worship-event-modal-date': '',
  'create-worship-event-modal-start-time': '',
  'create-worship-event-modal-end-time': '',
  'create-worship-event-modal-art': '',
  'create-worship-event-modal-orgel': '',
  'create-worship-event-modal-lesung': '',
  'create-worship-event-modal-kirchenkaffee': '',
  'create-worship-event-modal-kuester': '',
  'create-worship-event-modal-kv-abkuendigung': '',
  'create-worship-event-modal-kv-sammeldienst': '',
  'create-worship-event-modal-predigt': '',
  'create-worship-event-modal-besonderheiten': '',
});

const form = ref(emptyForm());

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isRequiredMissing() {
  return (
    !form.value['create-worship-event-modal-date'] ||
    !form.value['create-worship-event-modal-start-time'] ||
    !form.value['create-worship-event-modal-end-time']
  );
}

// Wandelt yyyy-MM-dd → dd.MM.yyyy um
function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

// ─── File handler ─────────────────────────────────────────────────────────────
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  uploadedFile.value = input.files?.[0] ?? null;
}

// ─── Submit ───────────────────────────────────────────────────────────────────
function handleSave() {
  if (activeTab.value === 'termin') {
    validated.value = true;
    if (isRequiredMissing()) return;

    const row: WorshipEventRow = {
      datum: formatDate(form.value['create-worship-event-modal-date']),
      startTime: form.value['create-worship-event-modal-start-time'],
      endTime: form.value['create-worship-event-modal-end-time'],
      art: form.value['create-worship-event-modal-art'],
      orgel: form.value['create-worship-event-modal-orgel'],
      lesung: form.value['create-worship-event-modal-lesung'],
      kirchenkaffee: form.value['create-worship-event-modal-kirchenkaffee'],
      kuester: form.value['create-worship-event-modal-kuester'],
      kvAbkuendigung: form.value['create-worship-event-modal-kv-abkuendigung'],
      kvSammeldienst: form.value['create-worship-event-modal-kv-sammeldienst'],
      predigt: form.value['create-worship-event-modal-predigt'],
      besonderheiten: form.value['create-worship-event-modal-besonderheiten'],
    };

    emit('saved', row);
    handleClose();
  } else {
    if (!uploadedFile.value) return;
    emit('file-uploaded', uploadedFile.value);
    handleClose();
  }
}

// ─── Schließen / Reset ────────────────────────────────────────────────────────
function handleClose() {
  emit('close');
  resetForm();
}

function resetForm() {
  form.value = emptyForm();
  activeTab.value = 'termin';
  validated.value = false;
  uploadedFile.value = null;
}

// ─── Öffentliche Methode: Datum vorausfüllen ──────────────────────────────────
function prefillDate(isoDate: string) {
  form.value['create-worship-event-modal-date'] = isoDate;
}

defineExpose({ prefillDate });
</script>

<template>
  <CModal
    :visible="props.visible"
    size="lg"
    backdrop="static"
    @close="handleClose"
  >
    <CModalHeader>
      <CModalTitle>Gottesdienst anlegen</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CTabs
        :active-item-key="activeTab"
        @update:active-item-key="activeTab = $event as 'termin' | 'upload'"
      >
        <CTabList variant="tabs">
          <CTab item-key="termin">Termin erstellen</CTab>
          <CTab item-key="upload">Datei hochladen</CTab>
        </CTabList>

        <CTabContent>
          <!-- ══════════════════════════════════════════════════
               Tab 1 – Termin erstellen
          ══════════════════════════════════════════════════ -->
          <CTabPanel item-key="termin" class="pt-3">
            <CForm
              id="createWorshipEventForm"
              :class="{ 'was-validated': validated }"
              novalidate
            >
              <!-- Pflichtfelder -->
              <CRow class="mb-3">
                <CCol md="4">
                  <CFormLabel for="create-worship-event-modal-date">
                    Datum <span class="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-date"
                    v-model="form['create-worship-event-modal-date']"
                    type="date"
                    required
                    :invalid="
                      validated && !form['create-worship-event-modal-date']
                    "
                  />
                  <CFormFeedback invalid>Pflichtfeld.</CFormFeedback>
                </CCol>

                <CCol md="4">
                  <CFormLabel for="create-worship-event-modal-start-time">
                    Beginn <span class="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-start-time"
                    v-model="form['create-worship-event-modal-start-time']"
                    type="time"
                    required
                    :invalid="
                      validated &&
                      !form['create-worship-event-modal-start-time']
                    "
                  />
                  <CFormFeedback invalid>Pflichtfeld.</CFormFeedback>
                </CCol>

                <CCol md="4">
                  <CFormLabel for="create-worship-event-modal-end-time">
                    Ende <span class="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-end-time"
                    v-model="form['create-worship-event-modal-end-time']"
                    type="time"
                    required
                    :invalid="
                      validated && !form['create-worship-event-modal-end-time']
                    "
                  />
                  <CFormFeedback invalid>Pflichtfeld.</CFormFeedback>
                </CCol>
              </CRow>

              <hr class="my-3" />

              <!-- Optionale Felder -->
              <CRow class="mb-3">
                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-art">
                    Art / Besonderheiten
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-art"
                    v-model="form['create-worship-event-modal-art']"
                    type="text"
                    placeholder="z. B. HomeKids, Konfirmation …"
                  />
                </CCol>

                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-predigt">
                    Predigt
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-predigt"
                    v-model="form['create-worship-event-modal-predigt']"
                    type="text"
                    placeholder="z. B. Quittkat"
                  />
                </CCol>
              </CRow>

              <CRow class="mb-3">
                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-orgel">
                    Orgel
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-orgel"
                    v-model="form['create-worship-event-modal-orgel']"
                    type="text"
                    placeholder="z. B. M. Meyer"
                  />
                </CCol>

                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-lesung">
                    Lesung
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-lesung"
                    v-model="form['create-worship-event-modal-lesung']"
                    type="text"
                    placeholder="z. B. Dagmar"
                  />
                </CCol>
              </CRow>

              <CRow class="mb-3">
                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-kuester">
                    Küster
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-kuester"
                    v-model="form['create-worship-event-modal-kuester']"
                    type="text"
                  />
                </CCol>

                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-kirchenkaffee">
                    Kirchenkaffee
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-kirchenkaffee"
                    v-model="form['create-worship-event-modal-kirchenkaffee']"
                    type="text"
                  />
                </CCol>
              </CRow>

              <CRow class="mb-3">
                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-kv-abkuendigung">
                    KV Abkündigung
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-kv-abkuendigung"
                    v-model="form['create-worship-event-modal-kv-abkuendigung']"
                    type="text"
                  />
                </CCol>

                <CCol md="6">
                  <CFormLabel for="create-worship-event-modal-kv-sammeldienst">
                    KV Sammeldienst
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-kv-sammeldienst"
                    v-model="form['create-worship-event-modal-kv-sammeldienst']"
                    type="text"
                  />
                </CCol>
              </CRow>

              <CRow class="mb-1">
                <CCol>
                  <CFormLabel for="create-worship-event-modal-besonderheiten">
                    Besonderheiten
                  </CFormLabel>
                  <CFormInput
                    id="create-worship-event-modal-besonderheiten"
                    v-model="form['create-worship-event-modal-besonderheiten']"
                    type="text"
                    placeholder="Weitere Hinweise …"
                  />
                </CCol>
              </CRow>
            </CForm>
          </CTabPanel>

          <!-- ══════════════════════════════════════════════════
               Tab 2 – Datei hochladen
          ══════════════════════════════════════════════════ -->
          <CTabPanel item-key="upload" class="pt-3">
            <CFormLabel for="create-worship-event-modal-file">
              XML-Datei
            </CFormLabel>
            <CFormInput
              id="create-worship-event-modal-file"
              type="file"
              accept=".xml"
              @change="onFileChange"
            />
            <div class="form-text text-muted mt-1">
              Nur <code>.xml</code>-Dateien werden akzeptiert.
            </div>

            <div v-if="uploadedFile" class="mt-3 text-success small">
              <CIcon :icon="cilCheckCircle" class="me-1" />
              Datei ausgewählt: <strong>{{ uploadedFile.name }}</strong>
            </div>
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="handleClose">
        Abbrechen
      </CButton>
      <CButton color="primary" @click="handleSave">
        <CIcon :icon="cilPlus" class="me-1" />
        Speichern
      </CButton>
    </CModalFooter>
  </CModal>
</template>
