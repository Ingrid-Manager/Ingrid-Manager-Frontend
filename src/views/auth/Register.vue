<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

type FieldId =
  | 'register-firstname'
  | 'register-lastname'
  | 'register-email'
  | 'register-password'
  | 'register-password-confirm';

// Nur die Felder, die tatsächlich fehlerhaft sind, werden rot markiert.
const invalidFields = ref<FieldId[]>([]);
const isInvalid = (field: FieldId) => invalidFields.value.includes(field);

// Muss mit der Passwort-Regel im Backend (AuthRegisterLoginDto) übereinstimmen:
// @MinLength(8) und /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/
const PASSWORD_RULES = [
  { label: 'mindestens 8 Zeichen', test: (pw: string) => pw.length >= 8 },
  { label: 'ein Kleinbuchstabe', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'ein Großbuchstabe', test: (pw: string) => /[A-Z]/.test(pw) },
  {
    label: 'eine Zahl oder ein Sonderzeichen',
    test: (pw: string) => /[\d\W]/.test(pw),
  },
];

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
    invalidFields.value = ['register-email'];
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto.';
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message && message !== 'Bad Request') {
    return message;
  }

  if (response?.status === 400 || response?.status === 422) {
    return 'Die Registrierung wurde abgelehnt. Bitte prüfe deine Eingaben.';
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

const passwordRules = computed(() =>
  PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    met: rule.test(form.value['register-password']),
  })),
);

watch(
  form,
  () => {
    error.value = '';
    invalidFields.value = [];
  },
  { deep: true },
);

const submit = async () => {
  if (form.value.website) {
    return;
  }

  error.value = '';
  invalidFields.value = [];

  const seconds = (Date.now() - loadedAt) / 1000;

  if (seconds < 3) {
    error.value = 'Bitte warte einen Moment';
    return;
  }

  const requiredFields: FieldId[] = [
    'register-firstname',
    'register-lastname',
    'register-email',
    'register-password',
    'register-password-confirm',
  ];
  const emptyFields = requiredFields.filter((field) => !form.value[field]);
  if (emptyFields.length > 0) {
    invalidFields.value = emptyFields;
    error.value = 'Bitte fülle alle Felder aus.';
    return;
  }

  const missingRules = passwordRules.value
    .filter((rule) => !rule.met)
    .map((rule) => rule.label);
  if (missingRules.length > 0) {
    invalidFields.value = ['register-password'];
    error.value = `Das Passwort erfüllt nicht alle Vorgaben. Es fehlt: ${missingRules.join(', ')}.`;
    return;
  }

  if (
    form.value['register-password'] !== form.value['register-password-confirm']
  ) {
    invalidFields.value = ['register-password-confirm'];
    error.value = 'Die Passwörter stimmen nicht überein.';
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
                            :invalid="isInvalid('register-firstname')"
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
                            :invalid="isInvalid('register-lastname')"
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
                        :invalid="isInvalid('register-email')"
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
                        :invalid="isInvalid('register-password')"
                      />
                    </CInputGroup>
                    <ul class="list-unstyled small mt-1 mb-3">
                      <li
                        v-for="rule in passwordRules"
                        :key="rule.label"
                        :class="
                          rule.met ? 'text-success' : 'text-body-secondary'
                        "
                      >
                        <CIcon
                          :icon="rule.met ? 'cil-check' : 'cil-x-circle'"
                          size="sm"
                          class="me-1"
                        />
                        {{ rule.label }}
                      </li>
                    </ul>

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
                        :invalid="isInvalid('register-password-confirm')"
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
