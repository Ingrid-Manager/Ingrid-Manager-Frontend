<script setup lang="ts">
import { ref } from 'vue';

// ─── Modal-Komponente ─────────────────────────────────────────────────────────
import RoomModal from '@/components/modals/RoomModal.vue';
import type { RoomPayload } from '@/components/modals/RoomModal.vue';

type RoomStatus = 'free' | 'booked' | 'unknown';

//interface Room extends RoomPayload {}

// Beispiel Daten
const rooms = ref<any[]>([
  {
    id: 1,
    name: 'Saal',
    status: 'free',
    temperature: '16',
    heatedtemperature: '24',
    cooledtemperature: '16',
  },
  {
    id: 2,
    name: 'Jugendraum',
    status: 'booked',
    temperature: '23',
    heatedtemperature: '23',
    cooledtemperature: '16',
  },
  {
    id: 3,
    name: 'Flur',
    status: 'booked',
    temperature: '23',
    heatedtemperature: '19',
    cooledtemperature: '16',
  },
  {
    id: 4,
    name: 'Workspace',
    status: 'free',
    temperature: '16',
    heatedtemperature: '24',
    cooledtemperature: '16',
  },
]);

const showModal = ref(false);
const modalRef = ref<InstanceType<typeof RoomModal> | null>(null);

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
        color: '#000000',
      }),
    0,
  );
}

function openEdit(room: any) {
  showModal.value = true;
  setTimeout(() => modalRef.value?.prefillRoom({ ...room }), 0);
}

function closeModal() {
  showModal.value = false;
}

function onRoomSaved(payload: RoomPayload) {
  const index = rooms.value.findIndex((r) => r.id === payload.id);

  if (index !== -1) {
    rooms.value[index] = { ...payload };
  } else {
    rooms.value.push({ ...payload, id: Date.now() });
  }
}

const statusColor = (status: RoomStatus): string => {
  switch (status) {
    case 'free':
      return 'success';
    case 'booked':
      return 'warning';
    case 'unknown':
      return 'warning';
    default:
      return 'light';
  }
};
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">
      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>Raumverwaltung</strong>
          <CButton color="info" @click="openCreate"> Raum erstellen </CButton>
        </CCardHeader>

        <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
          <div class="flex-grow-1 overflow-auto">
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Räume</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>(Soll)Temperatur</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="room in rooms" :key="room.id">
                  <CTableDataCell>
                    {{ room.name }}<br />
                    <div class="small">
                      Aufheiztemperatur: {{ room.heatedtemperature }}°C |
                      Absenktemperatur: {{ room.cooledtemperature }}°C
                    </div>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CBadge :color="statusColor(room.status)">
                      {{ room.status }}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell>{{ room.temperature }}</CTableDataCell>

                  <CTableDataCell>
                    <CButton color="primary" size="sm" @click="openEdit(room)">
                      Bearbeiten
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
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
