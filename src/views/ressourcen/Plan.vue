<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-4">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1800px">
      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <div>
            <strong>Gottesdienst Planung</strong>
            <span v-if="editMode" class="ms-3 text-warning">
              <CIcon :icon="cilPencil" class="me-1" />Bearbeitungsmodus aktiv
            </span>
          </div>
          <div class="d-flex gap-2">
            <CButton
              color="secondary"
              variant="outline"
              @click="showAddModal = true"
            >
              <CIcon :icon="cilPlus" class="me-2" />+ Gottesdienst
            </CButton>
            <CButton
              :color="editMode ? 'success' : 'primary'"
              @click="toggleEdit"
            >
              <CIcon :icon="editMode ? cilSave : cilPencil" class="me-2" />
              {{ editMode ? 'Speichern' : 'Bearbeiten' }}
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody class="flex-grow-1 d-flex flex-column p-0">
          <div class="flex-grow-1 overflow-auto">
            <table class="table table-bordered table-sm planung-table mb-0">
              <thead class="table-dark">
                <tr>
                  <th class="col-datum">Datum</th>
                  <th class="col-art">Art / Besonderheiten</th>
                  <th>Orgel</th>
                  <th>Lesung</th>
                  <th>Kirchenkaffee</th>
                  <th>Küster</th>
                  <th>KV Abkündigung</th>
                  <th>KV Sammeldienst</th>
                  <th>Predigt</th>
                  <th>Besonderheiten</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in filteredRows"
                  :key="index"
                  :class="getRowClass(row)"
                >
                  <td :class="['col-datum', getCellClass(row.datum)]">
                    <CFormInput
                      v-model="row.datum"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.datum) }"
                      :disabled="!editMode"
                      :title="row.datum || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.art)">
                    <CFormInput
                      v-model="row.art"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.art) }"
                      :disabled="!editMode"
                      :title="row.art || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.orgel)">
                    <CFormInput
                      v-model="row.orgel"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.orgel) }"
                      :disabled="!editMode"
                      :title="row.orgel || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.lesung)">
                    <CFormInput
                      v-model="row.lesung"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.lesung) }"
                      :disabled="!editMode"
                      :title="row.lesung || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.kirchenkaffee)">
                    <CFormInput
                      v-model="row.kirchenkaffee"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.kirchenkaffee) }"
                      :disabled="!editMode"
                      :title="row.kirchenkaffee || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.kuester)">
                    <CFormInput
                      v-model="row.kuester"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.kuester) }"
                      :disabled="!editMode"
                      :title="row.kuester || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.kvAbkuendigung)">
                    <CFormInput
                      v-model="row.kvAbkuendigung"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.kvAbkuendigung) }"
                      :disabled="!editMode"
                      :title="row.kvAbkuendigung || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.kvSammeldienst)">
                    <CFormInput
                      v-model="row.kvSammeldienst"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.kvSammeldienst) }"
                      :disabled="!editMode"
                      :title="row.kvSammeldienst || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.predigt)">
                    <CFormInput
                      v-model="row.predigt"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.predigt) }"
                      :disabled="!editMode"
                      :title="row.predigt || 'Leer'"
                    />
                  </td>
                  <td :class="getCellClass(row.besonderheiten)">
                    <CFormInput
                      v-model="row.besonderheiten"
                      type="text"
                      class="cell-input"
                      :class="{ 'cell-empty': isEmpty(row.besonderheiten) }"
                      :disabled="!editMode"
                      :title="row.besonderheiten || 'Leer'"
                    />
                  </td>
                </tr>
                <tr v-if="filteredRows.length === 0">
                  <td colspan="10" class="text-center text-muted py-4">
                    Keine Termine vorhanden.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CCardBody>

        <CCardFooter class="text-medium-emphasis small px-4 py-2">
          Gelb markierte Felder sind noch nicht ausgefüllt &middot; Grau
          hinterlegte Zeilen sind vergangene Termine &middot; Angezeigt: 2
          vergangene + Termine bis {{ maxDateLabel }}
        </CCardFooter>
      </CCard>
    </div>
  </div>

  <!-- ── Modal (ausgelagert) ───────────────────────────────────────────────── -->
  <CreateWorshipEventModal
    :visible="showAddModal"
    @close="showAddModal = false"
    @saved="onWorshipEventSaved"
    @file-uploaded="onFileUploaded"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { cilPencil, cilSave, cilPlus } from '@coreui/icons';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CCardFooter,
  CButton,
  CFormInput,
} from '@coreui/vue';
import CIcon from '@coreui/icons-vue';

import CreateWorshipEventModal from '@/components/modals/WorshipEventModal.vue';
// ─── Date setup ───────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 160);

const maxDateLabel = maxDate.toLocaleDateString('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// ─── State ────────────────────────────────────────────────
const editMode = ref(false);
const showAddModal = ref(false);

const rows = ref([
  {
    datum: '04.01.2026',
    art: 'regional',
    orgel: '//',
    lesung: '',
    kirchenkaffee: '//',
    kuester: '//',
    kvAbkuendigung: '//',
    kvSammeldienst: '//',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '11.01.2026',
    art: '11h AbJ',
    orgel: 'T. Brockmann',
    lesung: 'Bärbel M.',
    kirchenkaffee: '//',
    kuester: 'Stefan',
    kvAbkuendigung: 'Norbert',
    kvSammeldienst: 'Günter',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '18.01.2026',
    art: 'Etelsen!',
    orgel: '//',
    lesung: '//',
    kirchenkaffee: '//',
    kuester: '//',
    kvAbkuendigung: '//',
    kvSammeldienst: '//',
    predigt: '//',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '25.01.2026',
    art: 'HomeKids',
    orgel: 'T. Brockmann',
    lesung: 'Liane',
    kirchenkaffee: 'Liane',
    kuester: 'Fenja',
    kvAbkuendigung: 'Kirsten',
    kvSammeldienst: 'Michael',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '01.02.2026',
    art: '',
    orgel: 'T. Brockmann',
    lesung: 'Traute',
    kirchenkaffee: 'Heike',
    kuester: 'Ralf',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '08.02.2026',
    art: 'HomeKids',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: 'Ralf',
    kuester: 'Thomas',
    kvAbkuendigung: 'Michael',
    kvSammeldienst: 'Günter',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '15.02.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: 'Dagmar',
    kirchenkaffee: 'Liane',
    kuester: 'Stefan',
    kvAbkuendigung: 'Liane',
    kvSammeldienst: 'Jannik',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '22.02.2026',
    art: '',
    orgel: 'Band',
    lesung: 'Dagmar',
    kirchenkaffee: 'Dagmar',
    kuester: 'Dietrich',
    kvAbkuendigung: 'Norbert',
    kvSammeldienst: 'Liane',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '01.03.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: 'Traute',
    kirchenkaffee: 'Liane',
    kuester: 'Ingo',
    kvAbkuendigung: 'Kirsten',
    kvSammeldienst: 'Günter',
    predigt: 'Dagmar',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '06.03.2026',
    art: 'WGT',
    orgel: 'Chor Crescendo',
    lesung: '//',
    kirchenkaffee: '//',
    kuester: '//',
    kvAbkuendigung: '//',
    kvSammeldienst: 'Kirsten',
    predigt: 'Team',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '08.03.2026',
    art: 'Homekids',
    orgel: 'T. Brockmann',
    lesung: 'Bärbel M.',
    kirchenkaffee: 'Dagmar',
    kuester: 'Stefan',
    kvAbkuendigung: 'Michael',
    kvSammeldienst: 'Daniel',
    predigt: 'Quittkat',
    besonderheiten: 'Winterkirche',
  },
  {
    datum: '15.03.2026',
    art: 'Lätare, Pos.chor, anschl. Taufe 11.15h',
    orgel: 'M. Meyer',
    lesung: 'Liane',
    kirchenkaffee: 'Liane',
    kuester: 'Dietrich',
    kvAbkuendigung: 'Norbert',
    kvSammeldienst: 'Liane',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '22.03.2026',
    art: '',
    orgel: 'T. Brockmann',
    lesung: 'Dagmar',
    kirchenkaffee: 'Dagmar',
    kuester: 'Ralf',
    kvAbkuendigung: 'Jannik / Kirsten',
    kvSammeldienst: 'Jonathan',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '29.03.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: 'Traute',
    kirchenkaffee: 'Dagmar',
    kuester: 'Thomas',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '02.04.2026',
    art: 'Gründonnerstag, 19h',
    orgel: '',
    lesung: 'Quittkat',
    kirchenkaffee: '//',
    kuester: 'Ralf',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '03.04.2026',
    art: 'Karfreitag',
    orgel: '',
    lesung: 'Dagmar',
    kirchenkaffee: '//',
    kuester: 'Thomas',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '05.04.2026',
    art: 'Ostersonntag, anschl. Taufe 11h',
    orgel: 'M. Meyer',
    lesung: 'Quittkat',
    kirchenkaffee: '//',
    kuester: 'Ingo',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '06.04.2026',
    art: 'Ostermontag, regional',
    orgel: '//',
    lesung: '//',
    kirchenkaffee: '//',
    kuester: '//',
    kvAbkuendigung: '//',
    kvSammeldienst: '//',
    predigt: '//',
    besonderheiten: '//',
  },
  {
    datum: '12.04.2026',
    art: '11h ABJ',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '//',
    kuester: 'Dietrich',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '18.04.2026',
    art: 'Trauung Henrik & Maren, 14h',
    orgel: 'M. Meyer',
    lesung: '//',
    kirchenkaffee: '//',
    kuester: 'Stefan',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '19.04.2026',
    art: 'mit homekids',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: 'Dagmar',
    kuester: 'Stefan',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '26.04.2026',
    art: 'Konfirmation',
    orgel: 'M. Meyer',
    lesung: 'Quittkat',
    kirchenkaffee: '?',
    kuester: 'Fenja',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '03.05.2026',
    art: '',
    orgel: 'T. Brockmann',
    lesung: '',
    kirchenkaffee: 'Dagmar',
    kuester: 'Dietrich',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Speers',
    besonderheiten: '',
  },
  {
    datum: '10.05.2026',
    art: 'mit homekids',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: 'Dagmar',
    kuester: 'Fenja',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '14.05.2026',
    art: 'Himmelfahrt Freilichtbühne, 11h',
    orgel: 'Posaunenchöre',
    lesung: '',
    kirchenkaffee: '//',
    kuester: '???',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Grundhöfer, Gøbel',
    besonderheiten: '',
  },
  {
    datum: '16.05.2026',
    art: 'Trauung Janina Luttmann',
    orgel: 'T. Brockmann',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Ralf',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '17.05.2026',
    art: '11h AbJ',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Ralf',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '23.05.2026',
    art: 'Trauung Elfers, 12.30h',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Fenja',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '24.05.2026',
    art: 'Pfingstsonntag open air Intschede, 10h',
    orgel: 'Posaunenchöre',
    lesung: '',
    kirchenkaffee: '',
    kuester: '???',
    kvAbkuendigung: '',
    kvSammeldienst: '//',
    predigt: '//',
    besonderheiten: '',
  },
  {
    datum: '30.05.2026',
    art: 'Trauung Michelle & Felix, 15.30h',
    orgel: '?',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Stefan',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Lukas Wünsch',
    besonderheiten: '',
  },
  {
    datum: '31.05.2026',
    art: 'Kirchenkreisgottesdienst, St. Laurentius',
    orgel: '//',
    lesung: '//',
    kirchenkaffee: '//',
    kuester: '//',
    kvAbkuendigung: '//',
    kvSammeldienst: '//',
    predigt: '//',
    besonderheiten: '//',
  },
  {
    datum: '07.06.2026',
    art: '11h ABJ',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Dietrich',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '14.06.2026',
    art: '',
    orgel: 'T. Brockmann',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Ingo',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '21.06.2026',
    art: 'mit Sommerfest',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Fenja',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '28.06.2026',
    art: '',
    orgel: 'T. Brockmann',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Stefan',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '05.07.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '12.07.2026',
    art: '',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '19.07.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '26.07.2026',
    art: '',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '02.08.2026',
    art: '',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '08.08.2026',
    art: 'Trauung Marcel & Mareike M., 15h',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '09.08.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
  {
    datum: '15.08.2026',
    art: 'Einschulung',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '15.08.2026',
    art: 'Trauung Fehrmann, Lucas u. Julia, 14.30h',
    orgel: '',
    lesung: '',
    kirchenkaffee: '',
    kuester: 'Thomas',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: 'Quittkat',
    besonderheiten: '',
  },
  {
    datum: '16.08.2026',
    art: '',
    orgel: 'M. Meyer',
    lesung: '',
    kirchenkaffee: '',
    kuester: '',
    kvAbkuendigung: '',
    kvSammeldienst: '',
    predigt: '',
    besonderheiten: '',
  },
]);

// ─── Helpers ──────────────────────────────────────────────
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('.');
  if (parts.length !== 3) return null;
  return new Date(
    parseInt(parts[2]),
    parseInt(parts[1]) - 1,
    parseInt(parts[0]),
  );
}

function isEmpty(value) {
  return value === null || value === undefined || value.trim() === '';
}

function getCellClass(value) {
  return isEmpty(value) ? 'cell-yellow' : '';
}

function getRowClass(row) {
  const date = parseDate(row.datum);
  if (!date) return '';
  return date < today ? 'row-past' : '';
}

// ─── Computed ─────────────────────────────────────────────
const filteredRows = computed(() => {
  const past = [];
  const future = [];

  for (const row of rows.value) {
    const date = parseDate(row.datum);
    if (!date) continue;
    if (date < today) past.push(row);
    else if (date <= maxDate) future.push(row);
  }

  return [...past.slice(-2), ...future];
});

// ─── Modal-Callbacks ───────────────────────────────────────
function onWorshipEventSaved(row) {
  rows.value.push(row);
  // Hier bei Bedarf API-Call ergänzen
}

function onFileUploaded(file) {
  // Hier eigene XML-Verarbeitungslogik einfügen
  console.log('XML-Datei hochgeladen:', file.name);
}

// ─── Actions ──────────────────────────────────────────────
function toggleEdit() {
  editMode.value = !editMode.value;
  // Beim Speichern API-Call / emit hier ergänzen
}
</script>

<style>
/* ─── Table ──────────────────────────────────────────────── */
.planung-table {
  font-size: 0.82rem;
  min-width: 1400px;
}

.planung-table thead th {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
  padding: 0.55rem 0.6rem;
  position: sticky;
  top: 0;
  z-index: 2;
  color: #d1a110;
}

.planung-table td {
  padding: 0.2rem 0.4rem;
  vertical-align: middle;
}

.col-datum {
  min-width: 90px;
  white-space: nowrap;
}
.col-art {
  min-width: 280px;
}

.planung-table .cell-input:disabled,
.planung-table .cell-input[disabled] {
  background-color: var(--cui-body-bg) !important;
  opacity: 1 !important;
}

.planung-table .cell-yellow .cell-input {
  background-color: #383b46 !important;
}
</style>
