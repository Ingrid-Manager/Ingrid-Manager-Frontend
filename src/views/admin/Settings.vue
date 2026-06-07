<script setup lang="ts">
import { ref, computed } from 'vue';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgType = 'kirche' | 'verein' | 'sonstiges' | '';
type Bundesland =
  | 'BB'
  | 'BE'
  | 'BW'
  | 'BY'
  | 'HB'
  | 'HE'
  | 'HH'
  | 'MV'
  | 'NI'
  | 'NW'
  | 'RP'
  | 'SH'
  | 'SL'
  | 'SN'
  | 'ST'
  | 'TH'
  | '';
type TestStatus = 'ok' | 'err' | null;

interface OrgSettings {
  orgName: string;
  orgType: OrgType;
  orgEmail: string;
  orgWebsite: string;
  orgBundesland: Bundesland;
  techFirstName: string;
  techLastName: string;
  techEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  heizperiodeStartTag: string;
  heizperiodeStartMonat: string;
  heizperiodeEndeTag: string;
  heizperiodeEndeMonat: string;
  ressourcenKalender: boolean;
  heizstrg: boolean;
  mailversandAktiv: boolean
}

interface Location {
  id: number
  ahaTitle: string
  ahaUrl: string
  ahaUser: string
  ahaPassword: string
}

// ─── State ────────────────────────────────────────────────────────────────────

const activeTab = ref<string>('organisation');

const editMode = ref<Record<string, boolean>>({
  organisation: false,
  email: false,
  app: false,
});
const validated = ref<Record<string, boolean>>({
  organisation: false,
  email: false,
  app: false,
});
const savedVisible = ref<Record<string, boolean>>({
  organisation: false,
  email: false,
  app: false,
});

const locations = ref<Location[]>([
  { id: 1, ahaTitle: 'Location 1', ahaUrl: '', ahaUser: '', ahaPassword: '' },
])

const selectedLocationId = ref<number>(1)

const selectedLocation = computed(() =>
  locations.value.find((l) => l.id === selectedLocationId.value) ?? locations.value[0]
)

const editModeLocation = ref(false)
let locationSnapshot: Location | null = null

function addLocation() {
  const newId = Math.max(...locations.value.map((l) => l.id)) + 1
  locations.value.push({
    id: newId,
    ahaTitle: `Location ${newId}`,
    ahaUrl: '',
    ahaUser: '',
    ahaPassword: '',
  })
  selectedLocationId.value = newId
  editModeLocation.value = true
}

function startEditLocation() {
  locationSnapshot = { ...selectedLocation.value }
  editModeLocation.value = true
}

function cancelEditLocation() {
  if (locationSnapshot) {
    const idx = locations.value.findIndex((l) => l.id === selectedLocationId.value)
    if (idx !== -1) locations.value[idx] = { ...locationSnapshot }
  }
  editModeLocation.value = false
}

function saveLocation() {
  // TODO: API-Call
  editModeLocation.value = false
}

function deleteLocation() {
  if (locations.value.length <= 1) return
  locations.value = locations.value.filter((l) => l.id !== selectedLocationId.value)
  selectedLocationId.value = locations.value[0].id
}

const testStatus = ref<TestStatus>(null);
const testMessage = ref('');

const bundeslaender: { value: Bundesland; label: string }[] = [
  { value: 'BB', label: 'Brandenburg' },
  { value: 'BE', label: 'Berlin' },
  { value: 'BW', label: 'Baden-Württemberg' },
  { value: 'BY', label: 'Bayern' },
  { value: 'HB', label: 'Bremen' },
  { value: 'HE', label: 'Hessen' },
  { value: 'HH', label: 'Hamburg' },
  { value: 'MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'NI', label: 'Niedersachsen' },
  { value: 'NW', label: 'Nordrhein-Westfalen' },
  { value: 'RP', label: 'Rheinland-Pfalz' },
  { value: 'SH', label: 'Schleswig-Holstein' },
  { value: 'SL', label: 'Saarland' },
  { value: 'SN', label: 'Sachsen' },
  { value: 'ST', label: 'Sachsen-Anhalt' },
  { value: 'TH', label: 'Thüringen' },
];

const settings = ref<OrgSettings>({
  orgName: '',
  orgType: '',
  orgEmail: '',
  orgWebsite: '',
  orgBundesland: '',
  techFirstName: '',
  techLastName: '',
  techEmail: '',
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
  heizperiodeStartTag: '',
  heizperiodeStartMonat: '',
  heizperiodeEndeTag: '',
  heizperiodeEndeMonat: '',
  ressourcenKalender: false,
  heizstrg: false,
  mailversandAktiv: false,
});

let snapshots: Partial<Record<string, OrgSettings>> = {};

// ─── Heizperiode Datum-Validierung ────────────────────────────────────────────
const tage = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
);
const monate = [
  { value: '01', label: 'Januar' },
  { value: '02', label: 'Februar' },
  { value: '03', label: 'März' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Dezember' },
];

// ─── Edit / Save / Cancel ─────────────────────────────────────────────────────

const startEdit = (tab: string): void => {
  snapshots[tab] = { ...settings.value };
  editMode.value[tab] = true;
  validated.value[tab] = false;
  savedVisible.value[tab] = false;
  testStatus.value = null;
  testMessage.value = '';
};

const cancelEdit = (tab: string): void => {
  if (snapshots[tab]) settings.value = { ...snapshots[tab]! };
  editMode.value[tab] = false;
  validated.value[tab] = false;
};

const saveSettings = (tab: string, event: Event): void => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement | null;

  if (!form || !form.checkValidity()) {
    validated.value[tab] = true;
    return;
  }

  // TODO: await fetch('/api/save-organisation', { method: 'POST', body: JSON.stringify(settings.value) })

  editMode.value[tab] = false;
  validated.value[tab] = false;
  savedVisible.value[tab] = true;
  setTimeout(() => {
    savedVisible.value[tab] = false;
  }, 3000);
};

// ─── SMTP Actions ─────────────────────────────────────────────────────────────

const gatherSmtpPayload = () => ({
  host: settings.value.smtpHost,
  port: settings.value.smtpPort,
  user: settings.value.smtpUser,
  pass: settings.value.smtpPass,
});

const testSmtp = async (): Promise<void> => {
  testStatus.value = 'ok';
  testMessage.value = 'Teste Verbindung… Bitte warten';
  try {
    const resp = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gatherSmtpPayload()),
    });
    const json = await resp.json().catch(() => ({ ok: resp.ok }));
    testStatus.value = resp.ok && json?.ok ? 'ok' : 'err';
    testMessage.value =
      json?.message ??
      (resp.ok ? 'SMTP-Verbindung erfolgreich' : 'Verbindung fehlgeschlagen');
  } catch (err: unknown) {
    testStatus.value = 'err';
    testMessage.value =
      'Fehler: ' + (err instanceof Error ? err.message : String(err));
  }
};

const sendTestMail = async (): Promise<void> => {
  const to = settings.value.orgEmail || settings.value.techEmail;
  if (!to) {
    testStatus.value = 'err';
    testMessage.value =
      'Keine Empfängeradresse gefunden (Org- oder Tech-E-Mail).';
    return;
  }
  testStatus.value = 'ok';
  testMessage.value = 'Sende Testmail… Bitte warten';
  try {
    const resp = await fetch('/api/send-test-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gatherSmtpPayload(), to }),
    });
    const json = await resp.json().catch(() => ({ ok: resp.ok }));
    testStatus.value = resp.ok && json?.ok ? 'ok' : 'err';
    testMessage.value =
      json?.message ??
      (resp.ok ? 'Testmail erfolgreich gesendet' : 'Testmail fehlgeschlagen');
  } catch (err: unknown) {
    testStatus.value = 'err';
    testMessage.value =
      'Fehler: ' + (err instanceof Error ? err.message : String(err));
  }
};

// ─── Ressourcen Kalender ──────────────────────────────────────────────────────
defineExpose({
  ressourcenKalender: computed(() => settings.value.ressourcenKalender),
});
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100" style="max-width: 1200px">
      <CTabs
        :activeItemKey="activeTab"
        @activeItemKeyChange="activeTab = $event"
      >
        <CTabList variant="tabs">
          <CTab itemKey="organisation">Organisation</CTab>
          <CTab itemKey="locations">Locations</CTab>
          <CTab itemKey="app">Anwendungseinstellungen</CTab>
        </CTabList>

        <CTabContent>
          <!-- ══════════════════════════════════════════════════════════
               TAB 1 – Organisation & Ansprechpartner
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="organisation" class="p-0 pt-3">
            <CForm
              novalidate
              :validated="validated['organisation']"
              @submit="saveSettings('organisation', $event)"
            >
              <!-- Organisation -->
              <CCard class="mb-4">
                <CCardHeader><strong>Organisation</strong></CCardHeader>
                <CCardBody>
                  <CRow class="mb-3">
                    <CCol md="6">
                      <CFormInput
                        id="orgName"
                        v-model="settings.orgName"
                        label="Name der Organisation"
                        placeholder="z. B. Gemeinde Musterstadt"
                        :disabled="!editMode['organisation']"
                        required
                        feedback-invalid="Name der Organisation darf nicht leer sein."
                      />
                    </CCol>
                    <CCol md="6">
                      <CFormLabel for="orgType">Organisationstyp</CFormLabel>
                      <CFormSelect
                        id="orgType"
                        v-model="settings.orgType"
                        :disabled="!editMode['organisation']"
                        required
                      >
                        <option value="">— auswählen —</option>
                        <option value="kirche">Kirche</option>
                        <option value="verein">Verein</option>
                        <option value="sonstiges">Sonstiges</option>
                      </CFormSelect>
                      <div
                        v-if="validated['organisation'] && !settings.orgType"
                        class="invalid-feedback d-block"
                      >
                        Bitte einen Organisationstyp wählen.
                      </div>
                    </CCol>
                  </CRow>

                  <CRow>
                    <CCol md="6">
                      <CFormInput
                        id="orgEmail"
                        v-model="settings.orgEmail"
                        label="Mailadresse der Organisation"
                        type="email"
                        placeholder="kontakt@organisation.de"
                        :disabled="!editMode['organisation']"
                        required
                        feedback-invalid="Bitte eine gültige E-Mail-Adresse eingeben."
                      />
                    </CCol>
                    <CCol md="4">
                      <CFormInput
                        id="orgWebsite"
                        v-model="settings.orgWebsite"
                        label="Webadresse"
                        type="url"
                        required
                        placeholder="https://www.beispiel.de"
                        :disabled="!editMode['organisation']"
                        feedback-invalid="Bitte eine gültige URL eingeben (https://…)."
                      />
                    </CCol>
                    <CCol md="2">
                      <CFormLabel for="orgBundesland">Bundesland</CFormLabel>
                      <CFormSelect
                        id="orgBundesland"
                        v-model="settings.orgBundesland"
                        :disabled="!editMode['organisation']"
                        required
                      >
                        <option value="">— auswählen —</option>
                        <option
                          v-for="bl in bundeslaender"
                          :key="bl.value"
                          :value="bl.value"
                        >
                          {{ bl.label }}
                        </option>
                      </CFormSelect>
                      <div
                        v-if="
                          validated['organisation'] && !settings.orgBundesland
                        "
                        class="invalid-feedback d-block"
                      >
                        Bitte ein Bundesland wählen.
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <!-- Technischer Ansprechpartner -->
              <CCard class="mb-4">
                <CCardHeader
                  ><strong>Technischer Ansprechpartner</strong></CCardHeader
                >
                <CCardBody>
                  <CRow>
                    <CCol md="4">
                      <CFormInput
                        id="techFirstName"
                        v-model="settings.techFirstName"
                        label="Vorname"
                        placeholder="Vorname"
                        :disabled="!editMode['organisation']"
                        required
                        feedback-invalid="Vorname darf nicht leer sein."
                      />
                    </CCol>
                    <CCol md="4">
                      <CFormInput
                        id="techLastName"
                        v-model="settings.techLastName"
                        label="Nachname"
                        placeholder="Nachname"
                        :disabled="!editMode['organisation']"
                        required
                        feedback-invalid="Nachname darf nicht leer sein."
                      />
                    </CCol>
                    <CCol md="4">
                      <CFormInput
                        id="techEmail"
                        v-model="settings.techEmail"
                        label="E-Mail"
                        type="email"
                        placeholder="name@beispiel.de"
                        :disabled="!editMode['organisation']"
                        required
                        feedback-invalid="Bitte eine gültige E-Mail-Adresse eingeben."
                      />
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <!-- Footer Buttons -->
              <div class="d-flex gap-2 align-items-center mb-2">
                <template v-if="!editMode['organisation']">
                  <CButton
                    color="primary"
                    type="button"
                    @click="startEdit('organisation')"
                  >
                    Bearbeiten
                  </CButton>
                </template>
                <template v-else>
                  <CButton color="primary" type="submit">Speichern</CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    @click="cancelEdit('organisation')"
                  >
                    Abbrechen
                  </CButton>
                </template>
                <Transition name="fade">
                  <CBadge
                    v-if="savedVisible['organisation']"
                    color="success"
                    class="px-3 py-2 fs-6"
                  >
                    ✓ Gespeichert
                  </CBadge>
                </Transition>
              </div>
            </CForm>
          </CTabPanel>

          <!-- ══════════════════════════════════════════════════════════
               TAB 2 – Locations
          ══════════════════════════════════════════════════════════ -->
<CTabPanel itemKey="locations" class="p-0 pt-3">
  
  <CCard class="mb-4">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Locations</strong>
      <CButton color="info" size="sm" @click="addLocation">
        + Location hinzufügen
      </CButton>
    </CCardHeader>
    <CCardBody>

      <!-- Dropdown zur Location-Auswahl -->
      <CRow class="mb-4">
        <CCol md="4">
          <CFormLabel>Location auswählen</CFormLabel>
          <CFormSelect v-model="selectedLocationId">
            <option
              v-for="loc in locations"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.ahaTitle || `Location ${loc.id}` }}
            </option>
          </CFormSelect>
        </CCol>
      </CRow>

      <!-- Felder der gewählten Location -->
      <CRow class="mb-3">
        <CCol md="6">
          <CFormInput
            v-model="selectedLocation.ahaTitle"
            label="Name"
            placeholder="z. B. Hauptgebäude"
            :disabled="!editModeLocation"
            feedback-invalid="Name darf nicht leer sein."
          />
        </CCol>
        <CCol md="6">
          <CFormInput
            v-model="selectedLocation.ahaUrl"
            label="AHA URL"
            type="url"
            placeholder="https://"
            :disabled="!editModeLocation"
          />
        </CCol>
      </CRow>

      <CRow class="mb-3">
        <CCol md="6">
          <CFormInput
            v-model="selectedLocation.ahaUser"
            label="Benutzername"
            placeholder="admin"
            :disabled="!editModeLocation"
          />
        </CCol>
        <CCol md="6">
          <CFormInput
            v-model="selectedLocation.ahaPassword"
            label="Passwort"
            type="password"
            placeholder="Passwort"
            :disabled="!editModeLocation"
          />
        </CCol>
      </CRow>

      <!-- Aktions-Buttons -->
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <template v-if="!editModeLocation">
          <CButton color="primary" @click="startEditLocation">
            Bearbeiten
          </CButton>
          <CButton
            color="danger"
            variant="outline"
            :disabled="locations.length <= 1"
            @click="deleteLocation"
          >
            Location löschen
          </CButton>
        </template>
        <template v-else>
          <CButton color="primary" @click="saveLocation">Speichern</CButton>
          <CButton color="secondary" variant="outline" @click="cancelEditLocation">
            Abbrechen
          </CButton>
        </template>
      </div>

    </CCardBody>
  </CCard>

</CTabPanel>

          <!-- ══════════════════════════════════════════════════════════
               TAB 3 – Anwendungseinstellungen
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="app" class="p-0 pt-3">
            <CForm
              novalidate
              :validated="validated['app']"
              @submit="saveSettings('app', $event)"
            >
              <CCard class="mb-4">
                <CCardHeader><strong>Heizperiode</strong></CCardHeader>
                <CCardBody>
                  <CFormCheck
                    id="heizungssteuerung"
                    v-model="settings.heizstrg"
                    :disabled="!editMode['app']"
                    class="custom-check"
                  />
                  Heizungssteuerung aktivieren
                  <CRow>
                    <!-- Start -->
                    <CCol md="3">
                      <CFormLabel>Start der Heizperiode</CFormLabel>
                      <div class="d-flex gap-2">
                        <CFormSelect
                          v-model="settings.heizperiodeStartTag"
                          :disabled="!editMode['app']"
                          :required="settings.heizstrg"
                          style="width: 97px"
                        >
                          <option value="">TT</option>
                          <option v-for="t in tage" :key="t" :value="t">
                            {{ t }}
                          </option>
                        </CFormSelect>
                        <CFormSelect
                          v-model="settings.heizperiodeStartMonat"
                          :disabled="!editMode['app']"
                          :required="settings.heizstrg"
                        >
                          <option value="">Monat</option>
                          <option
                            v-for="m in monate"
                            :key="m.value"
                            :value="m.value"
                          >
                            {{ m.label }}
                          </option>
                        </CFormSelect>
                      </div>
                    </CCol>
                    <!-- Ende -->
                    <CCol md="3">
                      <CFormLabel>Ende der Heizperiode</CFormLabel>
                      <div class="d-flex gap-2">
                        <CFormSelect
                          v-model="settings.heizperiodeEndeTag"
                          :disabled="!editMode['app']"
                          :required="settings.heizstrg"
                          style="width: 97px"
                        >
                          <option value="">TT</option>
                          <option v-for="t in tage" :key="t" :value="t">
                            {{ t }}
                          </option>
                        </CFormSelect>
                        <CFormSelect
                          v-model="settings.heizperiodeEndeMonat"
                          :disabled="!editMode['app']"
                          :invalid="validated['app']"
                          :required="settings.heizstrg"
                        >
                          <option value="">Monat</option>
                          <option
                            v-for="m in monate"
                            :key="m.value"
                            :value="m.value"
                          >
                            {{ m.label }}
                          </option>
                        </CFormSelect>
                      </div>
                      <div
                        v-if="validated['app']"
                        class="text-danger small mt-1"
                      >
                        Bitte die Angaben kontrollieren!
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <!-- Ressourcen Kalender -->
              <CCard class="mb-4">
                <CCardHeader><strong>Ressourcen Kalender</strong></CCardHeader>
                <CCardBody>
                  <CFormCheck
                    id="ressourcenKalender"
                    v-model="settings.ressourcenKalender"
                    :disabled="!editMode['app']"
                    class="custom-check"
                  />
                  Ressourcen Kalender verwenden?
                </CCardBody>
              </CCard>
              <!-- E-Mail / SMTP Kurzansicht -->
<CCard class="mb-4">
  <CCardHeader><strong>E-Mail</strong></CCardHeader>
  <CCardBody>

    <!-- Mailversand aktivieren -->
    <CFormCheck
      id="mailversandAktiv"
      v-model="settings.mailversandAktiv"
      :disabled="!editMode['app']"
      label="Mailversand aktivieren"
      class="mb-3"
    />

    <!-- Mail-User (nur Anzeige, kein Bearbeiten) -->
    <CRow class="mb-3">
      <CCol md="6">
        <CFormLabel>Mail-User</CFormLabel>
        <CFormInput
          :value="settings.smtpUser || '—'"
          disabled
        />
      </CCol>
    </CRow>

    <!-- SMTP Test-Buttons – immer sichtbar -->
    <div class="d-flex gap-2 flex-wrap align-items-center">
      <CButton
        color="secondary"
        variant="outline"
        @click="testSmtp"
      >
        SMTP-Verbindung testen
      </CButton>
      <CButton
        color="secondary"
        variant="outline"
        @click="sendTestMail"
      >
        Testmail senden
      </CButton>
    </div>

    <CRow v-if="testStatus" class="mt-3">
      <CCol>
        <CAlert
          :color="testStatus === 'ok' ? 'success' : 'danger'"
          class="mb-0 py-2"
        >
          {{ testMessage }}
        </CAlert>
      </CCol>
    </CRow>

  </CCardBody>
</CCard>

              <!-- Footer Buttons -->
              <div class="d-flex gap-2 align-items-center mb-2">
                <template v-if="!editMode['app']">
                  <CButton
                    color="primary"
                    type="button"
                    @click="startEdit('app')"
                  >
                    Bearbeiten
                  </CButton>
                </template>
                <template v-else>
                  <CButton color="primary" type="submit">Speichern</CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    @click="cancelEdit('app')"
                  >
                    Abbrechen
                  </CButton>
                </template>
                <Transition name="fade">
                  <CBadge
                    v-if="savedVisible['app']"
                    color="success"
                    class="px-3 py-2 fs-6"
                  >
                    ✓ Gespeichert
                  </CBadge>
                </Transition>
              </div>
            </CForm>
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  </div>
</template>

<style scoped>
input[readonly] {
  background-color: var(--cui-tertiary-bg, #f8f9fa);
  color: var(--cui-secondary-color, #6c757d);
  cursor: default;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
