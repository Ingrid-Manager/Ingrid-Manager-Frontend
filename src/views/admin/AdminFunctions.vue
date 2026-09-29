<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { getUsers } from '@/api/users/getUsers';
import { transferOwner } from '@/api/ownershipTransfer';
import type { UserListItem } from '@/helper/interfaces/user/UserListItem';
import { runReorganization, getHolidays } from '@/api/reorganization';
import type { ReorganizationHoliday } from '@/api/reorganization';
import { getAllSeriesEvents } from '@/api/series/getAllSeriesEvents';
import type { SeriesEvent } from '@/helper/interfaces/series/SeriesEvent';

type TransferMode = 'series' | 'event';

const activeTab = ref<string>('ownership');

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
  loadSeriesEvents();
  loadHolidays();
});

// ─── Reorg Service ──────────────────────────────────────────────────────────

const seriesEvents = ref<SeriesEvent[]>([]);
const seriesEventsLoading = ref(false);
const seriesEventsError = ref('');

const holidays = ref<ReorganizationHoliday[]>([]);
const holidaysLoading = ref(false);
const holidaysError = ref('');

const reorgRunning = ref(false);
const reorgError = ref('');
const reorgSuccessMessage = ref('');

async function loadSeriesEvents() {
  seriesEventsLoading.value = true;
  seriesEventsError.value = '';
  try {
    seriesEvents.value = await getAllSeriesEvents();
  } catch (err) {
    console.error('Fehler beim Laden der Serientermine:', err);
    seriesEventsError.value = 'Serientermine konnten nicht geladen werden.';
  } finally {
    seriesEventsLoading.value = false;
  }
}

async function loadHolidays() {
  holidaysLoading.value = true;
  holidaysError.value = '';
  try {
    holidays.value = await getHolidays();
  } catch (err) {
    console.error('Fehler beim Laden der Ferien:', err);
    holidaysError.value = 'Ferien konnten nicht geladen werden.';
  } finally {
    holidaysLoading.value = false;
  }
}

async function startReorg() {
  reorgRunning.value = true;
  reorgError.value = '';
  reorgSuccessMessage.value = '';

  try {
    await runReorganization();
    reorgSuccessMessage.value = 'Reorg-Lauf wurde erfolgreich ausgeführt.';

    // Beide Listen spiegeln den Stand danach wieder (Ferien-Import und
    // Serien-Generierung können sich beide ändern).
    await Promise.all([loadSeriesEvents(), loadHolidays()]);
  } catch (err: any) {
    reorgError.value =
      err?.response?.data?.message ?? 'Der Reorg-Lauf ist fehlgeschlagen.';
    console.error('Fehler beim Reorg-Lauf:', err);
  } finally {
    reorgRunning.value = false;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('de-DE');
}

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
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100" style="max-width: 1200px">
      <h4 class="mb-3">Admin Funktionen</h4>

      <CAlert color="warning" class="mb-4">
        <strong>Nur für Administratoren.</strong> Änderungen hier greifen
        direkt in bestehende Daten ein und werden im Aktivitätsprotokoll
        erfasst.
      </CAlert>

      <CTabs
        :activeItemKey="activeTab"
        @activeItemKeyChange="activeTab = $event"
      >
        <CTabList variant="tabs">
          <CTab itemKey="ownership">Besitzer übertragen</CTab>
          <CTab itemKey="reorg">Reorg Service</CTab>
        </CTabList>

        <CTabContent>
          <!-- ══════════════════════════════════════════════════════════
               TAB 1 – Besitzer übertragen
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="ownership" class="p-0 pt-3">
            <CCard class="mb-4">
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
                    <label
                      class="btn btn-outline-primary"
                      for="transfer-mode-series"
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
                    <label
                      class="btn btn-outline-primary"
                      for="transfer-mode-event"
                      >Einzelner Termin</label
                    >
                  </div>
                  <div v-if="mode === 'event'" class="form-text">
                    Nur für Termine, die <strong>keiner Serie</strong>
                    angehören. Gehört der Termin zu einer Serie, muss die
                    gesamte Serie übertragen werden.
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
                  <CFormSelect
                    v-model.number="newOwnerId"
                    :disabled="usersLoading"
                  >
                    <option :value="null">Bitte wählen</option>
                    <option
                      v-for="user in users"
                      :key="user.id"
                      :value="user.id"
                    >
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
          </CTabPanel>

          <!-- ══════════════════════════════════════════════════════════
               TAB 2 – Reorg Service
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="reorg" class="p-0 pt-3">
            <CCard class="mb-4">
              <CCardHeader>
                <strong>Reorg Service</strong>
              </CCardHeader>

              <CCardBody>
                <CAlert v-if="reorgError" color="danger" class="mb-3">
                  {{ reorgError }}
                </CAlert>
                <CAlert v-if="reorgSuccessMessage" color="success" class="mb-3">
                  {{ reorgSuccessMessage }}
                </CAlert>

                <CButton
                  color="primary"
                  class="mb-4"
                  :disabled="reorgRunning"
                  @click="startReorg"
                >
                  <CSpinner v-if="reorgRunning" size="sm" class="me-2" />
                  {{ reorgRunning ? 'Reorg läuft…' : 'Reorg Starten' }}
                </CButton>

                <!-- Serientermine -->
                <div class="mb-2 d-flex justify-content-between align-items-center">
                  <CFormLabel class="mb-0">Serientermine</CFormLabel>
                  <span class="text-muted small">{{ seriesEvents.length }}</span>
                </div>
                <CAlert v-if="seriesEventsError" color="danger" class="mb-3">
                  {{ seriesEventsError }}
                </CAlert>
                <div v-else class="reorg-list mb-4">
                  <div
                    v-if="seriesEventsLoading"
                    class="d-flex justify-content-center py-3"
                  >
                    <CSpinner size="sm" color="primary" />
                  </div>
                  <template v-else>
                    <div
                      v-for="series in seriesEvents"
                      :key="series.id"
                      class="reorg-list__item"
                    >
                      <span class="text-muted small">#{{ series.id }}</span>
                      <span class="flex-grow-1">{{ series.title }}</span>
                      <CBadge :color="series.active ? 'success' : 'secondary'">
                        {{ series.active ? 'Aktiv' : 'Inaktiv' }}
                      </CBadge>
                    </div>
                    <p v-if="seriesEvents.length === 0" class="text-muted mb-0">
                      Keine Serientermine gefunden.
                    </p>
                  </template>
                </div>

                <!-- Ferien -->
                <div class="mb-2 d-flex justify-content-between align-items-center">
                  <CFormLabel class="mb-0">Ferien &amp; Feiertage</CFormLabel>
                  <span class="text-muted small">{{ holidays.length }}</span>
                </div>
                <CAlert v-if="holidaysError" color="danger" class="mb-0">
                  {{ holidaysError }}
                </CAlert>
                <div v-else class="reorg-list">
                  <div
                    v-if="holidaysLoading"
                    class="d-flex justify-content-center py-3"
                  >
                    <CSpinner size="sm" color="primary" />
                  </div>
                  <template v-else>
                    <div
                      v-for="holiday in holidays"
                      :key="holiday.id"
                      class="reorg-list__item"
                    >
                      <span class="text-muted small">#{{ holiday.id }}</span>
                      <span class="flex-grow-1">{{ holiday.title }}</span>
                      <span class="small text-muted">
                        {{ formatDate(holiday.start) }} –
                        {{ formatDate(holiday.end) }}
                      </span>
                    </div>
                    <p v-if="holidays.length === 0" class="text-muted mb-0">
                      Keine Ferien/Feiertage gefunden.
                    </p>
                  </template>
                </div>
              </CCardBody>
            </CCard>
          </CTabPanel>

          <!-- Weitere Admin-Funktionen werden hier als eigener CTab + CTabPanel ergänzt. -->
        </CTabContent>
      </CTabs>
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

<style scoped>
.reorg-list {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--cui-border-color, #d8dbe0);
  border-radius: 4px;
  padding: 8px 10px;
}

.reorg-list__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 4px 0;
  border-bottom: 1px solid var(--cui-border-color-translucent, #d8dbe0);
}

.reorg-list__item:last-child {
  border-bottom: none;
}
</style>
