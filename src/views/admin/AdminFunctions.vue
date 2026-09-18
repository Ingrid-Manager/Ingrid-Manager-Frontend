<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { getUsers } from '@/api/users/getUsers';
import { transferOwner } from '@/api/ownershipTransfer';
import type { UserListItem } from '@/helper/interfaces/user/UserListItem';

type TransferMode = 'series' | 'event';

const users = ref<UserListItem[]>([]);
const usersLoading = ref(false);

const mode = ref<TransferMode>('series');
const targetId = ref<number | null>(null);
const newOwnerId = ref<number | null>(null);

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const showConfirmModal = ref(false);

async function loadUsers() {
  usersLoading.value = true;
  try {
    users.value = await getUsers();
  } catch (err) {
    console.error('Fehler beim Laden der Nutzerliste:', err);
    errorMessage.value = 'Nutzerliste konnte nicht geladen werden.';
  } finally {
    usersLoading.value = false;
  }
}

onMounted(() => {
  loadUsers();
});

const targetIdLabel = computed(() =>
  mode.value === 'series' ? 'Serientermin-ID' : 'Termin-ID',
);

// CoreUI-Komponenten wenden das .number-v-model-Modifier nicht zuverlässig
// an (das ist nur für native Elemente garantiert, nicht für Komponenten) -
// daher hier bewusst per Number(...) statt uns auf das Modifier zu
// verlassen. Ohne das könnte z.B. ein String statt einer Zahl im JSON-Body
// landen und von @IsNumber() im Backend abgelehnt werden.
const targetIdNumber = computed(() => Number(targetId.value));
const newOwnerIdNumber = computed(() => Number(newOwnerId.value));

const selectedUser = computed(
  () => users.value.find((u) => u.id === newOwnerIdNumber.value) ?? null,
);

function userLabel(user: UserListItem): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name ? `${name} (${user.email})` : user.email;
}

const canSubmit = computed(
  () =>
    Number.isInteger(targetIdNumber.value) &&
    targetIdNumber.value > 0 &&
    Number.isInteger(newOwnerIdNumber.value) &&
    newOwnerIdNumber.value > 0,
);

function openConfirm() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!Number.isInteger(targetIdNumber.value) || targetIdNumber.value <= 0) {
    errorMessage.value =
      mode.value === 'series'
        ? 'Bitte eine gültige Serientermin-ID angeben.'
        : 'Bitte eine gültige Termin-ID angeben.';
    return;
  }

  if (!Number.isInteger(newOwnerIdNumber.value) || newOwnerIdNumber.value <= 0) {
    errorMessage.value = 'Bitte einen neuen Besitzer auswählen.';
    return;
  }

  showConfirmModal.value = true;
}

async function confirmTransfer() {
  showConfirmModal.value = false;

  if (!canSubmit.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const result = await transferOwner({
      seriesId: mode.value === 'series' ? targetIdNumber.value : undefined,
      calendarEventId: mode.value === 'event' ? targetIdNumber.value : undefined,
      newOwnerId: newOwnerIdNumber.value,
    });

    const ownerName = selectedUser.value ? userLabel(selectedUser.value) : `#${result.newOwnerId}`;

    successMessage.value =
      mode.value === 'series'
        ? `Serientermin #${result.seriesId} und ${result.affectedCalendarEvents ?? 0} zugehörige Termine wurden auf ${ownerName} übertragen.`
        : `Termin #${result.calendarEventId} wurde auf ${ownerName} übertragen.`;

    targetId.value = null;
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ??
      'Der Besitzer konnte nicht geändert werden.';
    console.error('Fehler bei der Besitzer-Übertragung:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-4">
    <div class="w-100 d-flex flex-column flex-grow-1 gap-3" style="max-width: 700px">
      <h4 class="mb-0">Admin Funktionen</h4>

      <CAlert color="warning" class="mb-0">
        <strong>Nur für Administratoren.</strong> Änderungen hier greifen
        direkt in bestehende Daten ein und werden im Aktivitätsprotokoll
        erfasst.
      </CAlert>

      <!-- ── Besitzer übertragen ─────────────────────────────────────────── -->
      <CCard>
        <CCardHeader>
          <strong>Besitzer übertragen</strong>
        </CCardHeader>

        <CCardBody>
          <div class="mb-3">
            <CFormLabel>Was soll übertragen werden?</CFormLabel>
            <div class="btn-group w-100" role="group">
              <input
                type="radio"
                class="btn-check"
                id="transfer-mode-series"
                value="series"
                v-model="mode"
                autocomplete="off"
              />
              <label class="btn btn-outline-primary" for="transfer-mode-series"
                >Serientermin (inkl. aller Einzeltermine)</label
              >

              <input
                type="radio"
                class="btn-check"
                id="transfer-mode-event"
                value="event"
                v-model="mode"
                autocomplete="off"
              />
              <label class="btn btn-outline-primary" for="transfer-mode-event"
                >Einzelner Termin</label
              >
            </div>
          </div>

          <div class="mb-3">
            <CFormInput
              id="transfer-target-id"
              v-model.number="targetId"
              type="number"
              min="1"
              :label="targetIdLabel"
            />
          </div>

          <div class="mb-3">
            <CFormLabel>Neuer Besitzer</CFormLabel>
            <CFormSelect v-model.number="newOwnerId" :disabled="usersLoading">
              <option :value="null">Bitte wählen</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ userLabel(user) }}
              </option>
            </CFormSelect>
          </div>

          <CAlert v-if="errorMessage" color="danger" class="mb-3">
            {{ errorMessage }}
          </CAlert>
          <CAlert v-if="successMessage" color="success" class="mb-3">
            {{ successMessage }}
          </CAlert>

          <CButton
            color="primary"
            :disabled="!canSubmit || loading"
            @click="openConfirm"
          >
            <CSpinner v-if="loading" size="sm" class="me-2" />
            {{ loading ? 'Wird übertragen…' : 'Besitzer übertragen' }}
          </CButton>
        </CCardBody>
      </CCard>

      <!-- Weitere Admin-Funktionen werden hier als eigene CCard ergänzt. -->
    </div>

    <!-- Bestätigungs-Dialog: keine Änderung ohne expliziten zweiten Schritt -->
    <CModal :visible="showConfirmModal" @close="showConfirmModal = false">
      <CModalHeader>
        <CModalTitle>Übertragung bestätigen</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p v-if="mode === 'series'">
          Der Besitzer von <strong>Serientermin #{{ targetIdNumber }}</strong> und
          <strong>allen zugehörigen Einzelterminen</strong> wird auf
          <strong>{{ selectedUser ? userLabel(selectedUser) : '' }}</strong>
          geändert.
        </p>
        <p v-else>
          Der Besitzer von <strong>Termin #{{ targetIdNumber }}</strong> wird auf
          <strong>{{ selectedUser ? userLabel(selectedUser) : '' }}</strong>
          geändert.
        </p>
        <p class="text-medium-emphasis small mb-0">
          Diese Aktion lässt sich nicht direkt zurücknehmen, sondern nur
          durch eine erneute Übertragung.
        </p>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          variant="outline"
          @click="showConfirmModal = false"
          >Abbrechen</CButton
        >
        <CButton color="primary" @click="confirmTransfer">Bestätigen</CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>
