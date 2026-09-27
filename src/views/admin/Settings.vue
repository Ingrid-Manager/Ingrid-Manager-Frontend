<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getOrgSettings } from '@/api/getSettings';
import {
  getAvmLocations,
  createAvmLocation,
  updateAvmLocation,
} from '@/api/avmLocations.api';
import type { Location } from '@/helper/interfaces/location/location';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'ok' | 'err' | null;

interface OrgSettings {
  orgName: string;
  orgType: string;
  orgEmail: string;
  orgWebsite: string;
  orgBundesland: string;
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
  mailversandAktiv: boolean;
}

interface LocationForm {
  title: string;
  ahaurl: string;
  ahauser: string;
  ahapassword: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

const activeTab = ref<string>('organisation');
const loadingSettings = ref(false);
const loadError = ref('');

// ─── Locations ────────────────────────────────────────────────────────────────

const locations = ref<Location[]>([]);
const loadingLocations = ref(false);
const savingLocation = ref(false);
const locationError = ref('');

const selectedLocationId = ref<number | null>(null);
const editModeLocation = ref(false);
// true while a location is being created (not yet saved in the backend)
const isNewLocation = ref(false);

const emptyLocationForm = (): LocationForm => ({
  title: '',
  ahaurl: '',
  ahauser: '',
  ahapassword: '',
});

// Edit buffer for the selected location; the password is never loaded from
// the backend and is only sent when a new one was entered.
const locationForm = ref<LocationForm>(emptyLocationForm());

const selectedLocation = computed(
  () => locations.value.find((l) => l.id === selectedLocationId.value) ?? null,
);

function fillLocationForm(loc: Location | null) {
  locationForm.value = loc
    ? {
        title: loc.title ?? '',
        ahaurl: loc.ahaurl ?? '',
        ahauser: loc.ahauser ?? '',
        ahapassword: '',
      }
    : emptyLocationForm();
}

watch(selectedLocation, (loc) => {
  if (!isNewLocation.value) fillLocationForm(loc);
});

async function loadLocations() {
  loadingLocations.value = true;
  locationError.value = '';
  try {
    locations.value = await getAvmLocations();
    if (!selectedLocation.value) {
      selectedLocationId.value = locations.value[0]?.id ?? null;
    }
  } catch (err) {
    console.error('Fehler beim Laden der Locations:', err);
    locationError.value = 'Locations konnten nicht geladen werden.';
  } finally {
    loadingLocations.value = false;
  }
}

function addLocation() {
  isNewLocation.value = true;
  locationForm.value = emptyLocationForm();
  editModeLocation.value = true;
  locationError.value = '';
}

function startEditLocation() {
  fillLocationForm(selectedLocation.value);
  editModeLocation.value = true;
  locationError.value = '';
}

function cancelEditLocation() {
  isNewLocation.value = false;
  editModeLocation.value = false;
  locationError.value = '';
  fillLocationForm(selectedLocation.value);
}

async function saveLocation() {
  const form = locationForm.value;
  const title = form.title.trim();
  if (!title) {
    locationError.value = 'Bitte einen Namen angeben.';
    return;
  }

  const payload = {
    title,
    ahaurl: form.ahaurl.trim(),
    ahauser: form.ahauser.trim(),
    ...(form.ahapassword ? { ahapassword: form.ahapassword } : {}),
  };

  savingLocation.value = true;
  locationError.value = '';
  try {
    if (isNewLocation.value) {
      const created = await createAvmLocation(payload);
      locations.value.push(created);
      isNewLocation.value = false;
      selectedLocationId.value = created.id;
    } else if (selectedLocationId.value !== null) {
      const updated = await updateAvmLocation({
        id: selectedLocationId.value,
        ...payload,
      });
      const idx = locations.value.findIndex((l) => l.id === updated.id);
      if (idx !== -1) locations.value[idx] = updated;
    }
    editModeLocation.value = false;
    fillLocationForm(selectedLocation.value);
  } catch (err) {
    console.error('Fehler beim Speichern der Location:', err);
    locationError.value = 'Location konnte nicht gespeichert werden.';
  } finally {
    savingLocation.value = false;
  }
}

// TODO: Löschen von Locations (DELETE /avm-locations/:id) wird später
// angebunden; der Button ist bis dahin ausgeblendet.

// TODO: SMTP-Verbindungstest / Testmail-Versand sind vorerst deaktiviert
// (Backend-Endpoints dafür existieren noch nicht) und werden zu einem
// späteren Zeitpunkt wieder aktiviert.
// const testStatus = ref<TestStatus>(null);
// const testMessage = ref('');

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

// ─── Load org settings from backend on mount ──────────────────────────────────

onMounted(async () => {
  loadLocations();
  loadingSettings.value = true;
  loadError.value = '';
  try {
    const data = await getOrgSettings();
    settings.value.orgName = data.orgName;
    settings.value.orgType = data.orgType;
    settings.value.orgEmail = data.orgEmail;
    settings.value.orgWebsite = data.orgWebsite;
    settings.value.orgBundesland = data.orgBundesland;
    settings.value.techFirstName = data.techFirstName;
    settings.value.techLastName = data.techLastName;
    settings.value.techEmail = data.techEmail;
    settings.value.smtpUser = data.smtpUser;
  } catch (err) {
    console.error('Fehler beim Laden der Einstellungen:', err);
    loadError.value =
      'Einstellungen konnten nicht geladen werden. Bitte Seite neu laden.';
  } finally {
    loadingSettings.value = false;
  }
});

// ─── Heizperiode ──────────────────────────────────────────────────────────────

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

// ─── SMTP Actions ─────────────────────────────────────────────────────────────
// Vorerst deaktiviert (siehe TODO bei testStatus/testMessage weiter oben) –
// es gibt noch keine Backend-Endpoints für SMTP-Verbindungstest/Testmail.

// const gatherSmtpPayload = () => ({
//   host: settings.value.smtpHost,
//   port: settings.value.smtpPort,
//   user: settings.value.smtpUser,
//   pass: settings.value.smtpPass,
// });

// const testSmtp = async (): Promise<void> => {
//   testStatus.value = 'ok';
//   testMessage.value = 'Teste Verbindung… Bitte warten';
//   try {
//     const resp = await fetch('/api/test-smtp', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(gatherSmtpPayload()),
//     });
//     const json = await resp.json().catch(() => ({ ok: resp.ok }));
//     testStatus.value = resp.ok && json?.ok ? 'ok' : 'err';
//     testMessage.value =
//       json?.message ??
//       (resp.ok ? 'SMTP-Verbindung erfolgreich' : 'Verbindung fehlgeschlagen');
//   } catch (err: unknown) {
//     testStatus.value = 'err';
//     testMessage.value =
//       'Fehler: ' + (err instanceof Error ? err.message : String(err));
//   }
// };

// const sendTestMail = async (): Promise<void> => {
//   const to = settings.value.orgEmail || settings.value.techEmail;
//   if (!to) {
//     testStatus.value = 'err';
//     testMessage.value =
//       'Keine Empfängeradresse gefunden (Org- oder Tech-E-Mail).';
//     return;
//   }
//   testStatus.value = 'ok';
//   testMessage.value = 'Sende Testmail… Bitte warten';
//   try {
//     const resp = await fetch('/api/send-test-mail', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ ...gatherSmtpPayload(), to }),
//     });
//     const json = await resp.json().catch(() => ({ ok: resp.ok }));
//     testStatus.value = resp.ok && json?.ok ? 'ok' : 'err';
//     testMessage.value =
//       json?.message ??
//       (resp.ok ? 'Testmail erfolgreich gesendet' : 'Testmail fehlgeschlagen');
//   } catch (err: unknown) {
//     testStatus.value = 'err';
//     testMessage.value =
//       'Fehler: ' + (err instanceof Error ? err.message : String(err));
//   }
// };

// ─── Ressourcen Kalender ──────────────────────────────────────────────────────
defineExpose({
  ressourcenKalender: computed(() => settings.value.ressourcenKalender),
});
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100" style="max-width: 1200px">
      <!-- Ladeindikator -->
      <div
        v-if="loadingSettings"
        class="d-flex justify-content-center align-items-center p-5"
      >
        <CSpinner color="primary" />
        <span class="ms-3 text-medium-emphasis"
          >Einstellungen werden geladen…</span
        >
      </div>

      <!-- Fehler beim Laden -->
      <CAlert v-if="loadError" color="danger" class="mb-3">
        {{ loadError }}
      </CAlert>

      <CTabs
        v-if="!loadingSettings"
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
            <CAlert color="info" class="small mb-4">
              <CIcon icon="cil-info" class="me-2" />
              Diese Einstellungen werden über die Serverkonfiguration verwaltet
              und können hier nicht bearbeitet werden.
            </CAlert>

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
                      disabled
                    />
                  </CCol>
                  <CCol md="6">
                    <CFormInput
                      id="orgType"
                      v-model="settings.orgType"
                      label="Organisationstyp"
                      disabled
                    />
                  </CCol>
                </CRow>
                <CRow>
                  <CCol md="6">
                    <CFormInput
                      id="orgEmail"
                      v-model="settings.orgEmail"
                      label="Mailadresse der Organisation"
                      disabled
                    />
                  </CCol>
                  <CCol md="4">
                    <CFormInput
                      id="orgWebsite"
                      v-model="settings.orgWebsite"
                      label="Webadresse"
                      disabled
                    />
                  </CCol>
                  <CCol md="2">
                    <CFormInput
                      id="orgBundesland"
                      v-model="settings.orgBundesland"
                      label="Bundesland"
                      disabled
                    />
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
                      disabled
                    />
                  </CCol>
                  <CCol md="4">
                    <CFormInput
                      id="techLastName"
                      v-model="settings.techLastName"
                      label="Nachname"
                      disabled
                    />
                  </CCol>
                  <CCol md="4">
                    <CFormInput
                      id="techEmail"
                      v-model="settings.techEmail"
                      label="E-Mail"
                      disabled
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CTabPanel>

          <!-- ══════════════════════════════════════════════════════════
               TAB 2 – Locations
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="locations" class="p-0 pt-3">
            <CCard class="mb-4">
              <CCardHeader
                class="d-flex justify-content-between align-items-center"
              >
                <strong>Locations</strong>
                <CButton
                  color="info"
                  size="sm"
                  :disabled="editModeLocation"
                  @click="addLocation"
                >
                  + Location hinzufügen
                </CButton>
              </CCardHeader>
              <CCardBody>
                <CAlert v-if="locationError" color="danger" class="mb-3">
                  {{ locationError }}
                </CAlert>

                <div
                  v-if="loadingLocations"
                  class="d-flex align-items-center p-3"
                >
                  <CSpinner color="primary" size="sm" />
                  <span class="ms-2 text-medium-emphasis"
                    >Locations werden geladen…</span
                  >
                </div>

                <p
                  v-else-if="!locations.length && !isNewLocation"
                  class="text-medium-emphasis mb-0"
                >
                  Es sind noch keine Locations angelegt.
                </p>

                <template v-else>
                  <!-- Dropdown zur Location-Auswahl -->
                  <CRow v-if="!isNewLocation" class="mb-4">
                    <CCol md="4">
                      <CFormLabel>Location auswählen</CFormLabel>
                      <CFormSelect
                        v-model.number="selectedLocationId"
                        :disabled="editModeLocation"
                      >
                        <option
                          v-for="loc in locations"
                          :key="loc.id"
                          :value="loc.id"
                        >
                          {{ loc.title || `Location ${loc.id}` }}
                        </option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <!-- Felder der gewählten Location -->
                  <CRow class="mb-3">
                    <CCol md="6">
                      <CFormInput
                        v-model="locationForm.title"
                        label="Name"
                        placeholder="z. B. Hauptgebäude"
                        :disabled="!editModeLocation"
                      />
                    </CCol>
                    <CCol md="6">
                      <CFormInput
                        v-model="locationForm.ahaurl"
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
                        v-model="locationForm.ahauser"
                        label="Benutzername"
                        placeholder="admin"
                        :disabled="!editModeLocation"
                      />
                    </CCol>
                    <CCol md="6">
                      <CFormInput
                        v-model="locationForm.ahapassword"
                        label="Passwort"
                        type="password"
                        autocomplete="new-password"
                        :placeholder="
                          isNewLocation
                            ? 'Passwort'
                            : 'Leer lassen, um das gespeicherte Passwort zu behalten'
                        "
                        :disabled="!editModeLocation"
                      />
                    </CCol>
                  </CRow>

                  <!-- Aktions-Buttons -->
                  <div class="d-flex gap-2 align-items-center flex-wrap">
                    <template v-if="!editModeLocation">
                      <CButton
                        color="primary"
                        :disabled="!selectedLocation"
                        @click="startEditLocation"
                      >
                        Bearbeiten
                      </CButton>
                      <!-- „Location löschen“ vorerst ausgeblendet, siehe TODO im Script -->
                    </template>
                    <template v-else>
                      <CButton
                        color="primary"
                        :disabled="savingLocation"
                        @click="saveLocation"
                      >
                        <CSpinner
                          v-if="savingLocation"
                          size="sm"
                          class="me-1"
                        />
                        Speichern
                      </CButton>
                      <CButton
                        color="secondary"
                        variant="outline"
                        :disabled="savingLocation"
                        @click="cancelEditLocation"
                      >
                        Abbrechen
                      </CButton>
                    </template>
                  </div>
                </template>
              </CCardBody>
            </CCard>
          </CTabPanel>

          <!-- ══════════════════════════════════════════════════════════
               TAB 3 – Anwendungseinstellungen
          ══════════════════════════════════════════════════════════ -->
          <CTabPanel itemKey="app" class="p-0 pt-3">
            <CAlert color="info" class="small mb-4">
              <CIcon icon="cil-info" class="me-2" />
              Diese Einstellungen werden über die Serverkonfiguration verwaltet
              und können hier nicht bearbeitet werden.
            </CAlert>

            <CCard class="mb-4">
              <CCardHeader><strong>Heizperiode</strong></CCardHeader>
              <CCardBody>
                <CFormCheck
                  id="heizungssteuerung"
                  v-model="settings.heizstrg"
                  disabled
                  label="Heizungssteuerung aktivieren"
                  class="mb-3"
                />
                <CRow>
                  <CCol md="3">
                    <CFormLabel>Start der Heizperiode</CFormLabel>
                    <div class="d-flex gap-2">
                      <CFormSelect
                        v-model="settings.heizperiodeStartTag"
                        disabled
                        style="width: 97px"
                      >
                        <option value="">TT</option>
                        <option v-for="t in tage" :key="t" :value="t">
                          {{ t }}
                        </option>
                      </CFormSelect>
                      <CFormSelect
                        v-model="settings.heizperiodeStartMonat"
                        disabled
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
                  <CCol md="3">
                    <CFormLabel>Ende der Heizperiode</CFormLabel>
                    <div class="d-flex gap-2">
                      <CFormSelect
                        v-model="settings.heizperiodeEndeTag"
                        disabled
                        style="width: 97px"
                      >
                        <option value="">TT</option>
                        <option v-for="t in tage" :key="t" :value="t">
                          {{ t }}
                        </option>
                      </CFormSelect>
                      <CFormSelect
                        v-model="settings.heizperiodeEndeMonat"
                        disabled
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
                  disabled
                  label="Ressourcen Kalender verwenden?"
                />
              </CCardBody>
            </CCard>

            <!-- E-Mail / SMTP -->
            <CCard class="mb-4">
              <CCardHeader><strong>E-Mail</strong></CCardHeader>
              <CCardBody>
                <CFormCheck
                  id="mailversandAktiv"
                  v-model="settings.mailversandAktiv"
                  disabled
                  label="Mailversand aktivieren"
                  class="mb-3"
                />
                <CRow class="mb-3">
                  <CCol md="6">
                    <CFormLabel>Mail-User</CFormLabel>
                    <CFormInput :value="settings.smtpUser || '—'" disabled />
                  </CCol>
                </CRow>
                <!-- TODO: SMTP-Verbindungstest / Testmail-Versand vorerst
                     deaktiviert, es gibt noch keine Backend-Endpoints dafür.
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
                -->
              </CCardBody>
            </CCard>
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
