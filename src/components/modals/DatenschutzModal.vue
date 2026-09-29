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
// damit jede Instanz des Ingrid Managers ihre eigene Datenschutzerklärung
// hinterlegen kann.
const responsible = import.meta.env.VITE_DATENSCHUTZ_RESPONSIBLE || '';
const responsibleAddress =
  import.meta.env.VITE_DATENSCHUTZ_RESPONSIBLE_ADDRESS || '';
const contactEmail = import.meta.env.VITE_DATENSCHUTZ_EMAIL || '';
const dpo = import.meta.env.VITE_DATENSCHUTZ_DPO || '';
const supervisoryAuthority =
  import.meta.env.VITE_DATENSCHUTZ_SUPERVISORY_AUTHORITY || '';
</script>

<template>
  <CModal size="lg" :visible="visible" @close="handleClose">
    <CModalHeader>
      <CModalTitle>Datenschutzerklärung</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <h6>1. Verantwortlicher</h6>
      <p class="mb-3">
        Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) für
        die Verarbeitung personenbezogener Daten im Ingrid Manager ist:
        <br />
        <template v-if="responsible">{{ responsible }}<br /></template>
        <template v-if="responsibleAddress">{{ responsibleAddress }}<br /></template>
        <template v-if="contactEmail">
          E-Mail:
          <a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>
        </template>
      </p>

      <template v-if="dpo">
        <h6>2. Datenschutzbeauftragte(r)</h6>
        <p class="mb-3">{{ dpo }}</p>
      </template>

      <h6>3. Erhebung und Speicherung personenbezogener Daten</h6>
      <p class="mb-3">
        Bei der Registrierung, Anmeldung und Nutzung des Ingrid Managers
        verarbeiten wir die von dir angegebenen personenbezogenen Daten
        (z. B. Name, E-Mail-Adresse, Passwort in verschlüsselter Form), um
        dir die Nutzung der Anwendung zu ermöglichen, dein Konto eindeutig
        zuzuordnen und dich bei technischen oder organisatorischen Fragen zu
        kontaktieren.
      </p>

      <h6>4. Rechtsgrundlage der Verarbeitung</h6>
      <p class="mb-3">
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
        (Erfüllung eines Vertrags bzw. vorvertraglicher Maßnahmen) sowie, für
        die Erfüllung rechtlicher Verpflichtungen, auf Grundlage von Art. 6
        Abs. 1 lit. c DSGVO.
      </p>

      <h6>5. Speicherdauer</h6>
      <p class="mb-3">
        Personenbezogene Daten werden nur so lange gespeichert, wie es für
        die Bereitstellung des Ingrid Managers oder zur Erfüllung
        gesetzlicher Aufbewahrungspflichten erforderlich ist. Nach
        Zweckfortfall bzw. Ablauf gesetzlicher Aufbewahrungsfristen werden
        die Daten gelöscht oder gesperrt.
      </p>

      <h6>6. Deine Rechte als betroffene Person</h6>
      <p class="mb-3">
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16
        DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung
        (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie
        Widerspruch gegen die Verarbeitung (Art. 21 DSGVO) deiner
        personenbezogenen Daten. Wende dich hierfür an die oben genannte
        Kontaktadresse.
      </p>

      <h6>7. Beschwerderecht bei der Aufsichtsbehörde</h6>
      <p class="mb-3">
        Dir steht außerdem ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde zu.
        <template v-if="supervisoryAuthority">
          Zuständig ist: {{ supervisoryAuthority }}.
        </template>
      </p>

      <h6>8. Cookies und technisch notwendige Daten</h6>
      <p class="mb-0">
        Der Ingrid Manager verwendet ausschließlich technisch notwendige
        Cookies bzw. lokale Speichertechnologien (z. B. zur Aufrechterhaltung
        deiner angemeldeten Sitzung). Eine Verarbeitung zu Analyse- oder
        Werbezwecken findet nicht statt.
      </p>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose">Schließen</CButton>
    </CModalFooter>
  </CModal>
</template>
