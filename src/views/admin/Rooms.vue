<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoomModal from '@/components/modals/RoomModal.vue';
import type { RoomPayload } from '@/components/modals/RoomModal.vue';
import { getRooms, createRoom, updateRoom } from '@/api/rooms.api';
import { getAvmLocations } from '@/api/avmLocations.api';
import type { Room } from '@/helper/interfaces/room/Room';
import type { Location } from '@/helper/interfaces/location/location';
import { cilPencil } from '@coreui/icons';
import CIcon from '@coreui/icons-vue';

// ─── State ────────────────────────────────────────────────────────────────────
const rooms = ref<Room[]>([]);
const locations = ref<Location[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const showModal = ref(false);
const modalRef = ref<InstanceType<typeof RoomModal> | null>(null);

// Ferien Raum immer ausblenden
const HIDDEN_ROOM_ID = 9999;

// ─── Laden ────────────────────────────────────────────────────────────────────
async function loadRooms() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await getRooms();
    rooms.value = result.filter((room) => room.id !== HIDDEN_ROOM_ID);
  } catch (err) {
    console.error('Fehler beim Laden der Räume:', err);
    errorMessage.value = 'Räume konnten nicht geladen werden.';
  } finally {
    loading.value = false;
  }
}

async function loadLocations() {
  try {
    locations.value = await getAvmLocations();
  } catch (err) {
    console.error('Fehler beim Laden der Standorte:', err);
  }
}

onMounted(() => {
  loadRooms();
  loadLocations();
});

// ─── Modal öffnen ─────────────────────────────────────────────────────────────
function openCreate() {
  showModal.value = true;
  setTimeout(
    () =>
      modalRef.value?.prefillRoom({
        id: 0,
        name: '',
        status: 'free',
        temperature: '',
        heatedtemperature: '',
        cooledtemperature: '',
        time: '',
        smarthomeid: '',
        color: '#3788d8',
        locationid: locations.value[0]?.id ?? null,
        hidden: false,
      }),
    0,
  );
}

function openEdit(room: Room) {
  showModal.value = true;
  setTimeout(
    () =>
      modalRef.value?.prefillRoom({
        id: room.id,
        name: room.title,
        status: 'free',
        temperature: '',
        heatedtemperature: String(room.comfort_temp ?? ''),
        cooledtemperature: String(room.empty_temp ?? ''),
        time: String(room.prelim_time ?? ''),
        smarthomeid: room.avm_id ?? '',
        color: room.color ?? '#3788d8',
        locationid: room.locationid ?? room.location?.id ?? null,
        hidden: room.hidden ?? false,
      }),
    0,
  );
}

function closeModal() {
  showModal.value = false;
}

// ─── Speichern ────────────────────────────────────────────────────────────────
async function onRoomSaved(payload: RoomPayload) {
  errorMessage.value = '';

  const isNew = payload.id === 0;

  const baseApiPayload = {
    title: payload.name,
    avm_id: payload.smarthomeid || undefined,
    comfort_temp: Number(payload.heatedtemperature),
    empty_temp: Number(payload.cooledtemperature),
    prelim_time: Number(payload.time),
    color: payload.color || '#3788d8',
    locationid: payload.locationid ?? undefined,
    hidden: payload.hidden ?? false,
  };

  try {
    if (isNew) {
      const created = await createRoom({
        ...baseApiPayload,
        heated: false,
      });
      rooms.value.push(created);
    } else {
      // "heated" wird bewusst nicht mitgeschickt: Der Wert wird von der
      // Heizungssteuerung/Automation gesetzt und soll beim Bearbeiten
      // der Raumdaten nicht überschrieben werden.
      const updated = await updateRoom(payload.id, baseApiPayload);
      const index = rooms.value.findIndex((r) => r.id === payload.id);
      if (index !== -1) {
        rooms.value[index] = updated;
      }
    }
  } catch (err: any) {
    console.error('Fehler beim Speichern des Raums:', err);
    errorMessage.value =
      err?.response?.data?.message ?? 'Raum konnte nicht gespeichert werden.';
  }
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────
function roomStatusLabel(room: Room): string {
  if (room.heated) return 'Beheizt';
  return 'Standby';
}

function roomStatusColor(room: Room): string {
  return room.heated ? 'success' : 'secondary';
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100 d-flex flex-column" style="max-width: 1200px">

      <!-- Fehlermeldung -->
      <CAlert v-if="errorMessage" color="danger" class="mb-3" dismissible @close="errorMessage = ''">
        {{ errorMessage }}
      </CAlert>

      <CCard class="d-flex flex-column">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>Raumverwaltung</strong>
          <CButton color="info" @click="openCreate">
            Raum erstellen
          </CButton>
        </CCardHeader>

        <CCardBody class="d-flex flex-column p-0">
          <!-- Ladezustand -->
          <div v-if="loading" class="d-flex justify-content-center align-items-center p-5">
            <CSpinner color="primary" />
            <span class="ms-3 text-medium-emphasis">Räume werden geladen…</span>
          </div>

          <!-- Leere Liste -->
          <div
            v-else-if="!loading && rooms.length === 0 && !errorMessage"
            class="d-flex flex-column align-items-center justify-content-center p-5 text-medium-emphasis"
          >
            <p class="mb-3">Noch keine Räume vorhanden.</p>
            <CButton color="info" variant="outline" @click="openCreate">
              Ersten Raum erstellen
            </CButton>
          </div>

          <!-- Tabelle -->
          <div v-else>
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Farbe</CTableHeaderCell>
                  <CTableHeaderCell>Raum</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Temperaturen</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Vorlaufzeit</CTableHeaderCell>
                  <CTableHeaderCell class="d-none d-md-table-cell">Fritz!Box-ID</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="room in rooms" :key="room.id">
                  <!-- Farbindikator -->
                  <CTableDataCell>
                    <div
                      :style="{ backgroundColor: room.color || '#3788d8' }"
                      style="width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.12);"
                    />
                  </CTableDataCell>

                  <!-- Name -->
                  <CTableDataCell>
                    <strong>{{ room.title }}</strong>
                    <div v-if="room.hidden" class="small text-medium-emphasis">
                      (ausgeblendet)
                    </div>
                  </CTableDataCell>

                  <!-- Status -->
                  <CTableDataCell>
                    <CBadge :color="roomStatusColor(room)">
                      {{ roomStatusLabel(room) }}
                    </CBadge>
                  </CTableDataCell>

                  <!-- Temperaturen -->
                  <CTableDataCell class="small d-none d-md-table-cell">
                    <span class="text-nowrap">
                      Komfort: {{ room.comfort_temp ?? '—' }}°C
                    </span>
                    <br />
                    <span class="text-nowrap text-medium-emphasis">
                      Absenkung: {{ room.empty_temp ?? '—' }}°C
                    </span>
                  </CTableDataCell>

                  <!-- Vorlaufzeit -->
                  <CTableDataCell class="small d-none d-md-table-cell">
                    {{ room.prelim_time != null ? `${room.prelim_time} Min.` : '—' }}
                  </CTableDataCell>

                  <!-- Fritz!Box-ID -->
                  <CTableDataCell class="small text-medium-emphasis d-none d-md-table-cell">
                    {{ room.avm_id || '—' }}
                  </CTableDataCell>

                  <!-- Aktionen -->
                  <!-- Aktionen -->
                  <CTableDataCell class="text-end">
                  <CButton color="primary" size="sm" @click="openEdit(room)">
                  <CIcon :icon="cilPencil" class="me-md-1" />
                  <span class="d-none d-md-inline">Bearbeiten</span>
                  </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>

        <CCardFooter class="text-medium-emphasis small">
          {{ rooms.length }} {{ rooms.length === 1 ? 'Raum' : 'Räume' }} gesamt
        </CCardFooter>
      </CCard>
    </div>

    <!-- Modal -->
    <RoomModal
      ref="modalRef"
      :visible="showModal"
      :locations="locations"
      @close="closeModal"
      @saved="onRoomSaved"
    />
  </div>
</template>