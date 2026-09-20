<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function handleClose() {
  emit('close');
}

// Inhalte werden über Umgebungsvariablen konfiguriert (siehe .env.production),
// damit jede Instanz des Ingrid Managers ihr eigenes Impressum hinterlegen kann.
const name = import.meta.env.VITE_IMPRESSUM_NAME || '';
const street = import.meta.env.VITE_IMPRESSUM_STREET || '';
const zipCity = import.meta.env.VITE_IMPRESSUM_ZIP_CITY || '';
const representedBy = import.meta.env.VITE_IMPRESSUM_REPRESENTED_BY || '';
const phone = import.meta.env.VITE_IMPRESSUM_PHONE || '';
const email = import.meta.env.VITE_IMPRESSUM_EMAIL || '';
const registerEntry = import.meta.env.VITE_IMPRESSUM_REGISTER_ENTRY || '';
const vatId = import.meta.env.VITE_IMPRESSUM_VAT_ID || '';
const responsibleForContent =
  import.meta.env.VITE_IMPRESSUM_RESPONSIBLE_FOR_CONTENT || '';
</script>

<template>
  <CModal size="lg" :visible="visible" @close="handleClose">
    <CModalHeader>
      <CModalTitle>Impressum</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <h6>Angaben gemäß § 5 DDG</h6>
      <p class="mb-3">
        <template v-if="name">{{ name }}<br /></template>
        <template v-if="street">{{ street }}<br /></template>
        <template v-if="zipCity">{{ zipCity }}</template>
      </p>

      <template v-if="representedBy">
        <h6>Vertreten durch</h6>
        <p class="mb-3">{{ representedBy }}</p>
      </template>

      <h6>Kontakt</h6>
      <p class="mb-3">
        <template v-if="phone">Telefon: {{ phone }}<br /></template>
        <template v-if="email">
          E-Mail:
          <a :href="`mailto:${email}`">{{ email }}</a>
        </template>
      </p>

      <template v-if="registerEntry">
        <h6>Registereintrag</h6>
        <p class="mb-3">{{ registerEntry }}</p>
      </template>

      <template v-if="vatId">
        <h6>Umsatzsteuer-Identifikationsnummer</h6>
        <p class="mb-3">
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
          {{ vatId }}
        </p>
      </template>

      <template v-if="responsibleForContent">
        <h6>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h6>
        <p class="mb-3">{{ responsibleForContent }}</p>
      </template>

      <h6>Streitschlichtung</h6>
      <p class="mb-0">
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        . Wir sind nicht bereit oder verpflichtet, an
        Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </p>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose">Schließen</CButton>
    </CModalFooter>
  </CModal>
</template>
