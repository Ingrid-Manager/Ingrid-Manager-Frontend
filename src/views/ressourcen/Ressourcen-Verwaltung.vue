<script setup>
import { ref, reactive } from 'vue';
import { cilPlus, cilPencil, cilTrash, cilSave } from '@coreui/icons';
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
  CFormCheck,
  CFormFeedback,
} from '@coreui/vue';
import CIcon from '@coreui/icons-vue';

const orgPrefix = 'OrgName';

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

const resources = ref([
  {
    id: 'OrgName.1',
    name: 'Beamer',
    color: '#008000',
    requiresConfirmation: false,
  },
  {
    id: 'OrgName.2',
    name: 'Floorspots',
    color: '#003d79',
    requiresConfirmation: true,
  },
  {
    id: 'OrgName.3',
    name: 'Auto',
    color: '#0008ff',
    requiresConfirmation: false,
  },
]);

const modalVisible = ref(false);
const isEditMode = ref(false);
const deleteModalVisible = ref(false);
const resourceToDelete = ref(null);
const nameError = ref(false);

const form = reactive({
  id: '',
  name: '',
  color: palette[0],
  requiresConfirmation: false,
  mail: '',
});

function generateNextId() {
  const regex = new RegExp(`^${orgPrefix.replace('.', '\\.')}\\.(\\d+)$`);
  const max = resources.value.reduce((m, r) => {
    const match = r.id.match(regex);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `${orgPrefix}.${max + 1}`;
}

function resetForm() {
  form.id = generateNextId();
  form.name = '';
  form.color = palette[0];
  form.requiresConfirmation = false;
  form.mail = '';
  nameError.value = false;
}

function openCreateModal() {
  isEditMode.value = false;
  resetForm();
  modalVisible.value = true;
}

function openEditModal(resource) {
  isEditMode.value = true;
  form.id = resource.id;
  form.name = resource.name;
  form.color = resource.color;
  form.requiresConfirmation = resource.requiresConfirmation;
  form.mail = '';
  nameError.value = false;
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
}

function selectColor(color) {
  form.color = color;
}
function onColorInputChange(e) {
  form.color = e.target.value;
}

function submitForm() {
  if (!form.name.trim()) {
    nameError.value = true;
    return;
  }
  nameError.value = false;

  if (isEditMode.value) {
    const idx = resources.value.findIndex((r) => r.id === form.id);
    if (idx !== -1) resources.value[idx] = { ...form, name: form.name.trim() };
  } else {
    resources.value.push({
      id: form.id,
      name: form.name.trim(),
      color: form.color,
      requiresConfirmation: form.requiresConfirmation,
    });
  }
  closeModal();
}

function confirmDelete(resource) {
  resourceToDelete.value = resource;
  deleteModalVisible.value = true;
}

function deleteResource() {
  resources.value = resources.value.filter(
    (r) => r.id !== resourceToDelete.value.id,
  );
  deleteModalVisible.value = false;
  resourceToDelete.value = null;
}
</script>
<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-4">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">
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
                  <CTableHeaderCell>Eindeutige ID</CTableHeaderCell>
                  <CTableHeaderCell>Bestätigung</CTableHeaderCell>
                  <CTableHeaderCell class="text-end">Aktionen</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow v-for="resource in resources" :key="resource.id">
                  <CTableDataCell>
                    <div
                      :style="{ background: resource.color }"
                      style="
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        border: 1px solid rgba(0, 0, 0, 0.12);
                      "
                    />
                  </CTableDataCell>
                  <CTableDataCell>{{ resource.name }}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color="secondary" shape="rounded-pill">{{
                      resource.id
                    }}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge
                      :color="
                        resource.requiresConfirmation ? 'warning' : 'success'
                      "
                    >
                      {{ resource.requiresConfirmation ? 'Ja' : 'Nein' }}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell class="text-end">
                    <CButton
                      color="secondary"
                      size="sm"
                      class="me-2"
                      @click="openEditModal(resource)"
                    >
                      <CIcon :icon="cilPencil" class="me-1" />
                      Bearbeiten
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      variant="outline"
                      @click="confirmDelete(resource)"
                    >
                      <CIcon :icon="cilTrash" class="me-1" />
                      Löschen
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
                <CTableRow v-if="resources.length === 0">
                  <CTableDataCell
                    colspan="5"
                    class="text-center text-muted py-4"
                  >
                    Keine Ressourcen vorhanden.
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <!-- Erstellen / Bearbeiten Modal -->
    <CModal
      :visible="modalVisible"
      @close="closeModal"
      backdrop="static"
      alignment="center"
    >
      <CModalHeader>
        <CModalTitle>{{
          isEditMode ? 'Ressource bearbeiten' : 'Neue Ressource erstellen'
        }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div class="mb-3">
          <CFormLabel for="resName">Bezeichnung</CFormLabel>
          <CFormInput
            id="resName"
            v-model="form.name"
            :invalid="nameError"
            placeholder="z. B. Kirche, Saal, …"
          />
          <CFormFeedback invalid
            >Bitte eine Bezeichnung eingeben.</CFormFeedback
          >
        </div>

        <div class="mb-3">
          <CFormLabel>Farbe im Kalender</CFormLabel>
          <div class="d-flex flex-wrap gap-1 mb-2">
            <button
              v-for="color in palette"
              :key="color"
              type="button"
              class="color-swatch"
              :class="{
                selected: form.color.toLowerCase() === color.toLowerCase(),
              }"
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

        <div class="mb-3">
          <CFormCheck
            id="resRequiresConfirmation"
            v-model="form.requiresConfirmation"
            label="Bestätigung erforderlich"
          />
        </div>
        <div class="mb-1">
          <CFormLabel for="resmail">E-Mail</CFormLabel>
          <CFormInput
            id="resmail"
            :value="form.mail"
            placeholder="Standardmäßig die Org. Mailadresse"
          />
          <div class="form-text text-muted">
            Mailadresse zur Info/Bestätigung
          </div>
        </div>
        <div class="mb-1">
          <CFormLabel for="resId">ID</CFormLabel>
          <CFormInput id="resId" :value="form.id" />
          <div class="form-text text-muted">
            Die ID kann eine Inventarnumer o.ä. sein.
          </div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" @click="closeModal"
          >Abbrechen</CButton
        >
        <CButton color="primary" @click="submitForm">
          <CIcon :icon="cilSave" class="me-2" />
          Speichern
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Löschen Bestätigungsdialog -->
    <CModal
      :visible="deleteModalVisible"
      @close="deleteModalVisible = false"
      alignment="center"
      size="sm"
    >
      <CModalHeader>
        <CModalTitle>Ressource löschen</CModalTitle>
      </CModalHeader>
      <CModalBody>
        Möchtest du <strong>{{ resourceToDelete?.name }}</strong> wirklich
        löschen? Diese Aktion kann nicht rückgängig gemacht werden.
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          variant="outline"
          @click="deleteModalVisible = false"
          >Abbrechen</CButton
        >
        <CButton color="danger" @click="deleteResource">
          <CIcon :icon="cilTrash" class="me-2" />
          Löschen
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
  transition:
    transform 0.12s ease,
    border-color 0.12s ease;
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
