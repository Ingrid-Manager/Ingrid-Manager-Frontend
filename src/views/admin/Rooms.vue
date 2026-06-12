<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoomModal from '@/components/modals/RoomModal.vue';
import type { RoomPayload } from '@/components/modals/RoomModal.vue';
import { getRooms, createRoom } from '@/api/rooms.api';
import type { Room } from '@/helper/interfaces/room/Room';

// ─── State ────────────────────────────────────────────────────────────────────
const rooms = ref<Room[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const showModal = ref(false);
const modalRef = ref<InstanceType<typeof RoomModal> | null>(null);

// ─── Laden ────────────────────────────────────────────────────────────────────
async function loadRooms() {
  loading.value = true;
  errorMessage.value = '';
  try {
    rooms.value = await getRooms();
  } catch (err) {
    console.error('Fehler beim Laden der Räume:', err);
    errorMessage.value = 'Räume konnten nicht geladen werden.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRooms();
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

  const apiPayload = {
    title: payload.name,
    avm_id: payload.smarthomeid || undefined,
    comfort_temp: Number(payload.heatedtemperature),
    empty_temp: Number(payload.cooledtemperature),
    prelim_time: Number(payload.time),
    heated: false,
    color: payload.color || '#3788d8',
    hidden: false,
    // locationid wird benötigt – sobald Locations über die API verfügbar sind,
    // kann hier dynamisch gewählt werden. Standardwert: 1
    locationid: 1,
  };

  try {
    if (isNew) {
      const created = await createRoom(apiPayload);
      rooms.value.push(created);
    } else {
      // PATCH-Endpunkt ist im Backend noch nicht vorhanden.
      // Sobald PATCH /rooms/:id implementiert ist, hier aufrufen:
      // await updateRoom(payload.id, apiPayload);
      // await loadRooms();
      console.warn('Backend-PATCH für Räume noch nicht implementiert. Lokales Update als Fallback.');
      const index = rooms.value.findIndex((r) => r.id === payload.id);
      if (index !== -1) {
        rooms.value[index] = {
          ...rooms.value[index],
          title: payload.name,
          avm_id: payload.smarthomeid || '',
          comfort_temp: Number(payload.heatedtemperature),
          empty_temp: Number(payload.cooledtemperature),
          prelim_time: Number(payload.time),
          color: payload.color || '#3788d8',
        };
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
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">

      <!-- Fehlermeldung -->
      <CAlert v-if="errorMessage" color="danger" class="mb-3" dismissible @close="errorMessage = ''">
        {{ errorMessage }}
      </CAlert>

      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>Raumverwaltung</strong>
          <CButton color="info" @click="openCreate">
            Raum erstellen
          </CButton>
        </CCardHeader>

        <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
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
          <div v-else class="flex-grow-1 overflow-auto">
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Farbe</CTableHeaderCell>
                  <CTableHeaderCell>Raum</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Temperaturen</CTableHeaderCell>
                  <CTableHeaderCell>Vorlaufzeit</CTableHeaderCell>
                  <CTableHeaderCell>Fritz!Box-ID</CTableHeaderCell>
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
                  <CTableDataCell class="small">
                    <span class="text-nowrap">
                      Komfort: {{ room.comfort_temp ?? '—' }}°C
                    </span>
                    <br />
                    <span class="text-nowrap text-medium-emphasis">
                      Absenkung: {{ room.empty_temp ?? '—' }}°C
                    </span>
                  </CTableDataCell>

                  <!-- Vorlaufzeit -->
                  <CTableDataCell class="small">
                    {{ room.prelim_time != null ? `${room.prelim_time} Min.` : '—' }}
                  </CTableDataCell>

                  <!-- Fritz!Box-ID -->
                  <CTableDataCell class="small text-medium-emphasis">
                    {{ room.avm_id || '—' }}
                  </CTableDataCell>

                  <!-- Aktionen -->
                  <CTableDataCell class="text-end">
                    <CButton color="primary" size="sm" @click="openEdit(room)">
                      Bearbeiten
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
      @close="closeModal"
      @saved="onRoomSaved"
    />
  </div>
</template>