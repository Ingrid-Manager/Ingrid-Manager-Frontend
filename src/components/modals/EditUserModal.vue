<script setup lang="ts">
import { UserListItem } from '@/helper/interfaces/user/UserListItem';
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  user: UserListItem | null;
}>();

const emit = defineEmits<{
  (e: 'save', payload: any): void
  (e: 'cancel'): void
  (e: 'reset-password'): void
}>();

const form = ref({
  email: '',
  firstName: '',
  lastName: '',
  userFunction: '',
  roleId: 2,
  statusId: 1,
})


const deleteCollapseVisible = ref(false);

// Sync form whenever the target user changes
watch(() => props.user, (user) => {
    if (!user) {
      return;
    }
    form.value.email = user.email;
    form.value.firstName = user.firstName;
    form.value.lastName = user.lastName;
    form.value.userFunction = user.userFunction || '';
    form.value.roleId = user.role.id;
    form.value.statusId = user.status.id;
  },
  {
    immediate: true,
  },
);

function handleSave() {
  if (!props.user) {
    return;
  }
  const payload: any = {};

  if (form.value.firstName !== props.user.firstName) {
    payload.firstName = form.value.firstName;
  }

  if (form.value.lastName !== props.user.lastName) {
    payload.lastName = form.value.lastName;
  }

  if (form.value.email !== props.user.email) {
    payload.email = form.value.email;
  }

  if (form.value.userFunction !== (props.user.userFunction || '')) {
    payload.userFunction = form.value.userFunction;
  }

  if (form.value.roleId !== props.user.role.id) {
    payload.role = {
      id:
        Number(
          form.value.roleId,
        ),
    };
  }

  if (form.value.statusId !== props.user.status.id) {
    payload.status = {
      id:
        Number(
          form.value.statusId,
        ),
    };
  }

  emit('save', payload);
}

const handleCancel = (): void => {
  deleteCollapseVisible.value = false;
  emit('cancel');
};

const handleConfirmDelete = (): void => {
  deleteCollapseVisible.value = false;
  const payload: any = {};
  payload.status = {
    id: 4
  };

  emit('save', payload);
};
</script>

<template>
  <CModal size="lg" :visible="visible" @close="handleCancel">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <CModalHeader>
      <CModalTitle>
        Benutzer bearbeiten –
        {{ user?.firstName }} {{ user?.lastName }}
      </CModalTitle>
    </CModalHeader>

    <!-- ── Body ───────────────────────────────────────────────────────────── -->
    <CModalBody>
      <!-- Name -->
      <CRow class="mb-3">
        <CCol :sm="6">
          <CFormLabel for="edit-user-modal-firstname">Vorname</CFormLabel>
          <CFormInput
            id="edit-user-modal-firstname"
            v-model="form.firstName"
            placeholder="Vorname"
          />
        </CCol>
        <CCol :sm="6">
          <CFormLabel for="edit-user-modal-lastname">Nachname</CFormLabel>
          <CFormInput
            id="edit-user-modal-lastname"
            v-model="form.lastName"
            placeholder="Nachname"
          />
        </CCol>
      </CRow>

      <!-- E-Mail -->
      <CRow class="mb-3">
        <CCol>
          <CFormLabel for="edit-user-modal-email">E-Mail-Adresse</CFormLabel>
          <CFormInput
            id="edit-user-modal-email"
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
          />
        </CCol>
      </CRow>
      
      <hr />

      <!-- Rolle und Status -->
      
<!-- Rolle + Status -->
      <CRow class="mb-3">
        <CCol :sm="6">
          <CFormLabel>Rolle</CFormLabel>
          <CFormSelect v-model="form.roleId">
            <option :value="4">Gast</option>
            <option :value="2">Benutzer</option>
            <option :value="3">Verwaltung</option>
            <option :value="1">Admin</option>
          </CFormSelect>
        </CCol>

        <CCol :sm="6">
          <CFormLabel>Status</CFormLabel>
          <CFormSelect v-model="form.statusId">
            <option :value="1">Aktiv</option>
            <option :value="2">Inaktiv</option>
            <option :value="4">Blockiert</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <hr />

      <!-- Action buttons -->
      <div class="d-flex gap-2 flex-wrap mb-2">
        <CButton
          id="edit-user-modal-btn-reset-password"
          size="sm"
          color="warning"
          @click="emit('reset-password')"
        >
          Passwort zurücksetzen
        </CButton>

        <CButton
          id="edit-user-modal-btn-delete"
          size="sm"
          color="danger"
          @click="deleteCollapseVisible = !deleteCollapseVisible"
        >
          Benutzer löschen
        </CButton>
      </div>

      <!-- Delete confirmation (CCollapse) -->
      <CCollapse :visible="deleteCollapseVisible">
        <CCard class="border-warning mt-1">
          <CCardBody>
            <p class="mb-2 text-warning-emphasis">
              Willst du den Benutzer
              <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
              wirklich <strong>löschen</strong>? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </p>
            <div class="d-flex gap-2">
              <CButton
                id="edit-user-modal-btn-delete-confirm"
                size="sm"
                color="danger"
                @click="handleConfirmDelete()"
              >
                Ja, löschen
              </CButton>
              <CButton
                id="edit-user-modal-btn-delete-abort"
                size="sm"
                color="secondary"
                @click="deleteCollapseVisible = false"
              >
                Abbrechen
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCollapse>
    </CModalBody>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <CModalFooter>
      <CButton
        id="edit-user-modal-btn-cancel"
        color="secondary"
        @click="handleCancel"
      >
        Abbrechen
      </CButton>
      <CButton
        id="edit-user-modal-btn-save"
        color="primary"
        @click="handleSave"
      >
        Speichern
      </CButton>
    </CModalFooter>
  </CModal>
</template>
