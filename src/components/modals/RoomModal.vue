<script setup lang="ts">
import { ref, computed } from 'vue';

type RoomStatus = 'free' | 'booked' | 'unknown';

export interface RoomPayload {
  id: number;
  name: string;
  status: RoomStatus;
  temperature: string;
  heatedtemperature: string;
  cooledtemperature: string;
  time?: string;
  smarthomeid?: string;
  color?: string;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', room: RoomPayload): void;
}>();

const form = ref<RoomPayload>({
  id: 0,
  name: '',
  status: 'free',
  temperature: '',
  heatedtemperature: '',
  cooledtemperature: '',
  time: '',
  smarthomeid: '',
  color: '#000000',
});

const validated = ref(false);

function prefillRoom(room: RoomPayload) {
  form.value = { ...room };
}

defineExpose({ prefillRoom });

const modalTitle = computed(() =>
  form.value.id === 0 ? 'Raum erstellen' : 'Raum bearbeiten',
);

function handleSubmit(event: Event) {
  event.preventDefault();

  const formEl = event.currentTarget as HTMLFormElement | null;
  if (!formEl || !formEl.checkValidity()) {
    event.stopPropagation();
    validated.value = true;
    return;
  }

  validated.value = false;
  emit('saved', { ...form.value });
  handleClose();
}

function handleClose() {
  emit('close');
  resetForm();
}

function resetForm() {
  form.value = {
    id: 0,
    name: '',
    status: 'free',
    temperature: '',
    heatedtemperature: '',
    cooledtemperature: '',
    time: '',
    smarthomeid: '',
    color: '#000000',
  };
  validated.value = false;
}
</script>

<template>
  <CModal :visible="props.visible" @close="handleClose">
    <CForm novalidate :validated="validated" @submit="handleSubmit">
      <CModalHeader>
        <CModalTitle>{{ modalTitle }}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div class="mb-3">
          <CFormInput
            id="create-room-modal-title"
            v-model="form.name"
            label="Name"
            required
            feedback-invalid="Name darf nicht leer sein."
          />
        </div>

        <div class="mb-3">
          <CFormInput
            id="create-room-modal-heatedtemperature"
            v-model="form.heatedtemperature"
            label="Komforttemperatur"
            type="number"
            step="0.5"
            min="5"
            max="30"
            required
            feedback-invalid="Bitte eine Zahl zwischen 5 und 30 eingeben."
          />
        </div>

        <div class="mb-3">
          <CFormInput
            id="create-room-modal-cooledtemperature"
            v-model="form.cooledtemperature"
            label="Absenktemperatur"
            type="number"
            step="0.5"
            min="5"
            max="30"
            required
            feedback-invalid="Bitte eine Zahl zwischen 5 und 30 eingeben."
          />
        </div>

        <div class="mb-3">
          <CFormInput
            id="create-room-modal-time"
            v-model="form.time"
            label="Aufheiz-Zeitraum (in Minuten)"
            type="number"
            min="0"
            required
            feedback-invalid="Bitte eine Zahl eingeben."
          />
        </div>

        <div class="mb-3">
          <CFormInput
            id="create-room-modal-smarthomeid"
            v-model="form.smarthomeid"
            label="Fritzbox-ID"
          />
        </div>

        <div class="mb-3">
          <CFormInput
            id="create-room-modal-color"
            v-model="form.color"
            type="color"
            label="Kalender Farbe"
          />
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" @click="handleClose">Abbrechen</CButton>
        <CButton color="primary" type="submit">Speichern</CButton>
      </CModalFooter>
    </CForm>
  </CModal>
</template>
