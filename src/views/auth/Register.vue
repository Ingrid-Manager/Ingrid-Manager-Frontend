<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/api/register.api';
import ImpressumModal from '@/components/modals/ImpressumModal.vue';
import DatenschutzModal from '@/components/modals/DatenschutzModal.vue';

const router = useRouter();

const loading = ref(false);
const error = ref('');
const success = ref(false);
const loadedAt = Date.now();
const showImpressum = ref(false);
const showDatenschutz = ref(false);

// Muss mit der Passwort-Regel im Backend (AuthRegisterLoginDto) übereinstimmen.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/;
const PASSWORD_HINT =
  'Mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie mindestens eine Zahl oder ein Sonderzeichen.';

function passwordPolicyError(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`;
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return 'Das Passwort muss Groß- und Kleinbuchstaben sowie mindestens eine Zahl oder ein Sonderzeichen enthalten.';
  }
  return '';
}

// Übersetzt die Fehlerantwort des Backends in eine verständliche Meldung.
// Validierungsfehler kommen als { message: string[] }, fachliche Fehler als
// { errors: { feld: 'code' } }; ein reines "Bad Request" ist nicht hilfreich.
function describeRegisterError(err: unknown): string {
  const response = (
    err as {
      response?: {
        status?: number;
        data?: { message?: unknown; errors?: Record<string, unknown> };
      };
    }
  )?.response;
  const message = response?.data?.message;

  if (response?.data?.errors?.email === 'emailAlreadyExists') {
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto.';
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message && message !== 'Bad Request') {
    return message;
  }

  if (response?.status === 400 || response?.status === 422) {
    return `Die Registrierung wurde abgelehnt. Bitte prüfe deine Eingaben. Passwort: ${PASSWORD_HINT}`;
  }

  return 'Registrierung fehlgeschlagen.';
}

const form = ref({
  'register-firstname': '',
  'register-lastname': '',
  'register-email': '',
  'register-password': '',
  'register-password-confirm': '',
  //honeypot
  website: '',
});

watch(
  form,
  () => {
    error.value = '';
  },
  { deep: true },
);

const submit = async () => {
  if (form.value.website) {
    return;
  }

  error.value = '';

  const seconds = (Date.now() - loadedAt) / 1000;

  if (seconds < 3) {
    error.value = 'Bitte warte einen Moment';
    return;
  }

  if (
    !form.value['register-firstname'] ||
    !form.value['register-lastname'] ||
    !form.value['register-email'] ||
    !form.value['register-password'] ||
    !form.value['register-password-confirm']
  ) {
    error.value = 'Bitte fülle alle Felder aus.';
    return;
  }

  if (
    form.value['register-password'] !== form.value['register-password-confirm']
  ) {
    error.value = 'Die Passwörter stimmen nicht überein.';
    return;
  }

  const passwordError = passwordPolicyError(form.value['register-password']);
  if (passwordError) {
    error.value = passwordError;
    return;
  }

  loading.value = true;

  try {
    await register({
      email: form.value['register-email'],
      password: form.value['register-password'],
      firstName: form.value['register-firstname'],
      lastName: form.value['register-lastname'],
    });

    success.value = true;
  } catch (err) {
    console.error(err);
    error.value = describeRegisterError(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="wrapper min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="8">
          <CRow class="g-0">
            <CCol :xs="12" :md="7">
              <CCard class="p-4">
                <CCardBody>
                  <!-- Erfolgsmeldung nach Registrierung -->
                  <div v-if="success">
                    <h1>Registrierung erfolgreich</h1>
                    <p class="text-body-secondary">
                      Dein Konto wurde erstellt. Bitte bestätige deine Mailadresse.
                      Danach kann die Verwaltung dich freischalten.
                    </p>
                    <CButton
                      color="primary"
                      class="mt-2"
                      @click="router.push('/auth/login')"
                    >
                      Zur Anmeldung
                    </CButton>
                  </div>

                  <!-- Registrierungsformular -->
                  <CForm v-else @submit.prevent="submit">
                    <h1>Registrieren</h1>
                    <p class="text-body-secondary">Erstelle dein Konto.</p>

                    <CAlert
                      v-if="error"
                      color="danger"
                      class="mb-3"
                      dismissible
                    >
                      {{ error }}
                    </CAlert>
                    <CAlert v-if="success" color="success" class="mb-3">
                      Registrierung erfolgreich. Ein Administrator muss den
                      Account freischalten.
                    </CAlert>

                    <!-- Vorname & Nachname -->
                    <CRow class="mb-3">
                      <CCol :sm="6" class="mb-3 mb-sm-0">
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon="cil-user" />
                          </CInputGroupText>
                          <CFormInput
                            id="register-firstname"
                            v-model="form['register-firstname']"
                            placeholder="Vorname"
                            autocomplete="given-name"
                            :invalid="!!error"
                          />
                        </CInputGroup>
                      </CCol>
                      <CCol :sm="6">
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon="cil-user" />
                          </CInputGroupText>
                          <CFormInput
                            id="register-lastname"
                            v-model="form['register-lastname']"
                            placeholder="Nachname"
                            autocomplete="family-name"
                            :invalid="!!error"
                          />
                        </CInputGroup>
                      </CCol>
                    </CRow>

                    <!-- E-Mail -->
                    <CInputGroup class="mb-3">
                      <CInputGroupText>@</CInputGroupText>
                      <CFormInput
                        id="register-email"
                        v-model="form['register-email']"
                        type="email"
                        placeholder="E-Mail Adresse"
                        autocomplete="email"
                        :invalid="!!error"
                      />
                    </CInputGroup>

                    <!-- Passwort -->
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon="cil-lock-locked" />
                      </CInputGroupText>
                      <CFormInput
                        id="register-password"
                        v-model="form['register-password']"
                        type="password"
                        placeholder="Passwort"
                        autocomplete="new-password"
                        :invalid="!!error"
                      />
                    </CInputGroup>
                    <div class="form-text mb-3">{{ PASSWORD_HINT }}</div>

                    <!-- Passwort bestätigen -->
                    <CInputGroup class="mb-4">
                      <CInputGroupText>
                        <CIcon icon="cil-lock-locked" />
                      </CInputGroupText>
                      <CFormInput
                        id="register-password-confirm"
                        v-model="form['register-password-confirm']"
                        type="password"
                        placeholder="Passwort bestätigen"
                        autocomplete="new-password"
                        :invalid="!!error"
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol :xs="6">
                        <CButton
                          color="primary"
                          class="px-4"
                          type="submit"
                          :disabled="loading"
                        >
                          {{ loading ? 'Wird registriert…' : 'Registrieren' }}
                        </CButton>
                      </CCol>
                      <CCol :xs="6" class="text-end">
                        <CButton
                          color="link"
                          class="px-0"
                          @click="router.push('/auth/login')"
                        >
                          Bereits registriert?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol :xs="12" :md="5">
              <CCard class="text-white bg-primary py-5 h-100">
                <CCardBody
                  class="text-center d-flex flex-column justify-content-center"
                >
                  <h2>Willkommen</h2>
                  <p>
                    Nach der Registrierung muss dein Konto von der Verwaltung
                    freigeschaltet werden. Erst danach kannst du dich anmelden.
                  </p>
                  <CButton
                    color="light"
                    variant="outline"
                    class="mt-3"
                    @click="router.push('/auth/login')"
                  >
                    Zur Anmeldung
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
      </CRow>
      <CRow class="justify-content-center mt-3">
        <CCol :md="8" class="text-center">
          <CButton
            color="link"
            class="text-body-secondary"
            @click="showImpressum = true"
          >
            Impressum
          </CButton>
          <CButton
            color="link"
            class="text-body-secondary"
            @click="showDatenschutz = true"
          >
            Datenschutz
          </CButton>
        </CCol>
      </CRow>
    </CContainer>

    <ImpressumModal
      :visible="showImpressum"
      @close="showImpressum = false"
    />
    <DatenschutzModal
      :visible="showDatenschutz"
      @close="showDatenschutz = false"
    />
  </div>
</template>
