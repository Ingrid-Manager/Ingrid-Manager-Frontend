<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'single'): void
  (e: 'split'): void
  (e: 'series'): void
  (e: 'close'): void
}>()
</script>

<template>
  <CModal
    :visible="visible"
    alignment="center"
    @close="emit('close')"
  >
    <CModalHeader>
      <CModalTitle>
        Serien-Termin
      </CModalTitle>
    </CModalHeader>

    <CModalBody>
      <p>
        Dieses Ereignis gehört zu einer Serie.
      </p>

      <p>
        Was möchtest du bearbeiten?
      </p>
    </CModalBody>

    <CModalFooter class="d-flex flex-column gap-2">
      <CButton
        color="primary"
        class="w-100"
        @click="emit('single')"
      >
        Nur diesen Termin bearbeiten
      </CButton>

      <CButton
        color="warning"
        class="w-100"
        @click="emit('split')"
      >
        Alle zukünftigen Termine bearbeiten
      </CButton>

      <CButton
        color="secondary"
        variant="outline"
        class="w-100"
        @click="emit('close')"
      >
        Abbrechen
      </CButton>
    </CModalFooter>
  </CModal>
</template>