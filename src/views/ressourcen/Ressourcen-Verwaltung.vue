<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { cilPlus, cilPencil, cilSave } from '@coreui/icons';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormLabel,
  CFormInput,
  CFormFeedback,
  CAlert,
} from '@coreui/vue';
import CIcon from '@coreui/icons-vue';
import { getResource } from '@/api/getResource';
import { createResource } from '@/api/createResource';
import { updateResource } from '@/api/updateResource';
import type { ResourceNames } from '@/helper/interfaces/resource/ResourceNames';

// ─── Palette ──────────────────────────────────────────────────────────────────
const palette = [
  '#008000',
  '#003d79',
  '#ff0000',
  '#f0b939',
  '#000000',
  '#fd31f8',
  '#00ff20',
  '#aaa7a7',
  '#ff7f50',
  '#6a5acd',
];

// ─── State ────────────────────────────────────────────────────────────────────
const resources = ref<ResourceNames[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const modalVisible = ref(false);
const isEditMode = ref(false);
const nameError = ref(false);
const saving = ref(false);

const emailError = ref(false);
// E-Mail-Formatprüfung
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = reactive({
  id: 0,
  title: '',
  color: palette[0],
  manager_email: '',
  inventoryid: '',
});

// ─── Resourcen laden ─────────────────────────────────────────────────────────
async function loadResources() {
  loading.value = true;
  errorMessage.value = '';
  try {
    resources.value = await getResource();
  } catch (err) {
    console.error('Fehler beim Laden der Ressourcen:', err);
    errorMessage.value = 'Ressourcen konnten nicht geladen werden.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadResources();
});

// ─── Modal öffnen ─────────────────────────────────────────────────────────────
function resetForm() {
  form.id = 0;
  form.title = '';
  form.color = palette[0];
  form.manager_email = '';
  form.inventoryid = '';
  nameError.value = false;
}

function openCreateModal() {
  isEditMode.value = false;
  resetForm();
  modalVisible.value = true;
}

function openEditModal(resource: ResourceNames) {
  isEditMode.value = true;
  form.id = resource.id;
  form.title = resource.title;
  form.color = resource.color;
  form.manager_email = resource.manager_email ?? '';
  form.inventoryid = resource.inventoryid ?? '';
  nameError.value = false;
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
}

function selectColor(color: string) {
  form.color = color;
}

function onColorInputChange(e: Event) {
  form.color = (e.target as HTMLInputElement).value;
}

// ─── Speichern ────────────────────────────────────────────────────────────────
async function submitForm() {
  if (!form.title.trim()) {
    nameError.value = true;
    return;
  }
  nameError.value = false;

  // Manager-E-Mail ist optional, muss aber – falls ausgefüllt – ein gültiges Format haben
  const trimmedEmail = form.manager_email.trim();
  if (trimmedEmail && !emailPattern.test(trimmedEmail)) {
    emailError.value = true;
    return;
  }
  emailError.value = false;

  saving.value = true;
  errorMessage.value = '';

  try {
    const payload = {
      title: form.title.trim(),
      color: form.color,
      manager_email: trimmedEmail || undefined,
      inventoryid: form.inventoryid || undefined,
    };

    if (isEditMode.value) {
      await updateResource(form.id, payload);
    } else {
      await createResource(payload);
    }

    await loadResources();
    closeModal();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    errorMessage.value = 'Resource konnte nicht gespeichert werden.';
  } finally {
    saving.value = false;
  }
}

</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-4">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">

      <CAlert v-if="errorMessage" color="danger" class="mb-3">
        {{ errorMessage }}
      </CAlert>

      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>Ressourcen Verwaltung</strong>
          <CButton color="primary" @click="openCreateModal">
            <CIcon :icon="cilPlus" class="me-2" />
            Neue Ressource erstellen
          </CButton>
        </CCardHeader>

        <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
          <div class="flex-grow-1 overflow-auto">
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Farbe</CTableHeaderCell>
                  <CTableHeaderCell>Bezeichnung</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Inventar-ID</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Manager E-Mail</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Aktionen</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow v-if="loading">
                  <CTableDataCell colspan="5" class="text-center py-4">
                    Wird geladen…
                  </CTableDataCell>
                </CTableRow>

                <CTableRow v-else-if="resources.length === 0">
                  <CTableDataCell colspan="5" class="text-center text-muted py-4">
                    Keine Resourcen vorhanden.
                  </CTableDataCell>
                </CTableRow>

                <template v-else>
                  <CTableRow v-for="resource in resources" :key="resource.id">
                    <CTableDataCell>
                      <div
                        :style="{ background: resource.color }"
                        style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.12);"
                      />
                    </CTableDataCell>
                    <CTableDataCell>{{ resource.title }}</CTableDataCell>
                    <CTableDataCell class="d-none d-md-table-cell">
                      <CBadge color="secondary" shape="rounded-pill">
                      {{ resource.inventoryid || '—' }}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell class="d-none d-md-table-cell">
                      {{ resource.manager_email || '—' }}
                    </CTableDataCell>
                    <CTableDataCell class="text-end">
                      <CButton
                          color="primary"
                          size="sm"
                          @click="openEditModal(resource)"
                          >
                          <CIcon :icon="cilPencil" class="me-md-1" />
                          <span class="d-none d-md-inline">Bearbeiten</span>
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                </template>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <!-- ── Erstellen / Bearbeiten Modal ───────────────────────────────────── -->
    <CModal
      :visible="modalVisible"
      backdrop="static"
      alignment="center"
      @close="closeModal"
    >
      <CModalHeader>
        <CModalTitle>
          {{ isEditMode ? 'Resource bearbeiten' : 'Neue Resource erstellen' }}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <!-- Bezeichnung -->
        <div class="mb-3">
          <CFormLabel for="resName">Bezeichnung</CFormLabel>
          <CFormInput
            id="resName"
            v-model="form.title"
            :invalid="nameError"
            placeholder="z. B. Beamer, Auto, …"
          />
          <CFormFeedback invalid>Bitte eine Bezeichnung eingeben.</CFormFeedback>
        </div>

        <!-- Farbe -->
        <div class="mb-3">
          <CFormLabel>Farbe im Kalender</CFormLabel>
          <div class="d-flex flex-wrap gap-1 mb-2">
            <button
              v-for="color in palette"
              :key="color"
              type="button"
              class="color-swatch"
              :class="{ selected: form.color.toLowerCase() === color.toLowerCase() }"
              :style="{ background: color }"
              :title="color"
              @click="selectColor(color)"
            />
          </div>
          <div class="d-flex align-items-center gap-2">
            <CFormInput
              id="resColor"
              v-model="form.color"
              type="color"
              style="width: 56px; padding: 4px; height: 38px"
              @input="onColorInputChange"
            />
            <small class="text-muted">oder Farbe frei wählen</small>
          </div>
        </div>

        <!-- Manager E-Mail -->
        <div class="mb-3">
          <CFormLabel for="resmail">Manager E-Mail</CFormLabel>
          <CFormInput
           id="resmail"
            v-model="form.manager_email"
           type="email"
           :invalid="emailError"
             placeholder="Standardmäßig die Org. Mailadresse"
              />
<CFormFeedback invalid>Bitte eine gültige E-Mail-Adresse eingeben.</CFormFeedback>
          <div class="form-text text-muted">
            Mailadresse zur Info/Bestätigung
          </div>
        </div>

        <!-- Inventar-ID -->
        <div class="mb-1">
          <CFormLabel for="resId">Inventar-ID</CFormLabel>
          <CFormInput
            id="resId"
            v-model="form.inventoryid"
            placeholder="z. B. INV-001"
          />
          <div class="form-text text-muted">
            Kann eine Inventarnummer o.ä. sein.
          </div>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" @click="closeModal">
          Abbrechen
        </CButton>
        <CButton color="primary" :disabled="saving" @click="submitForm">
          <CIcon :icon="cilSave" class="me-2" />
          {{ saving ? 'Wird gespeichert…' : 'Speichern' }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<style scoped>
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.color-swatch:hover {
  transform: scale(1.12);
}
.color-swatch.selected {
  border-color: rgba(0, 0, 0, 0.4);
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}
</style>