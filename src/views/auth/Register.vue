<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/api/register.api';

const router = useRouter();

const loading = ref(false);
const error = ref('');
const success = ref(false);
const loadedAt = Date.now();

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
    error.value = 'Bitte waren Sie einen Moment';
    return;
  }

  if (
    !form.value['register-firstname'] ||
    !form.value['register-lastname'] ||
    !form.value['register-email'] ||
    !form.value['register-password'] ||
    !form.value['register-password-confirm']
  ) {
    error.value = 'Bitte füllen Sie alle Felder aus.';
    return;
  }

  if (form.value['register-password'] !== form.value['register-password-confirm']) {
    error.value = 'Die Passwörter stimmen nicht überein.';
    return;
  }

  if (form.value['register-password'].length < 8) {
    error.value = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    return;
  }

  loading.value = true;

  try {
    await register({
      email: form.value['register-email'],
      password:form.value['register-password'],
      firstName: form.value['register-firstname'],
      lastName:form.value['register-lastname'],
    });

    success.value = true;

  } catch (err: any) {
    console.error(err);
    error.value = err?.response?.data?.message || 'Registrierung fehlgeschlagen.';
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
                      Ihr Konto wurde erstellt. Sie müssen von Ihrem Administrator
                      freigeschaltet werden, bevor Sie sich anmelden können.
                    </p>
                    <CButton color="primary" class="mt-2" @click="router.push('/auth/login')">
                      Zur Anmeldung
                    </CButton>
                  </div>

                  <!-- Registrierungsformular -->
                  <CForm v-else @submit.prevent="submit">
                    <h1>Registrieren</h1>
                    <p class="text-body-secondary">Erstellen Sie Ihr Konto.</p>

                    <CAlert
                      v-if="error"
                      color="danger"
                      class="mb-3"
                      dismissible
                    >
                      {{ error }}
                    </CAlert>
                    <CAlert v-if="success" color="success" class="mb-3"> 
                      Registrierung erfolgreich.
                      Ein Administrator muss den Account freischalten.
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
                    <CInputGroup class="mb-3">
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
                <CCardBody class="text-center d-flex flex-column justify-content-center">
                  <h2>Willkommen</h2>
                  <p>
                    Nach der Registrierung muss Ihr Konto von der Verwaltung
                    freigeschaltet werden. Erst danach können Sie sich anmelden.
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
    </CContainer>
  </div>
</template>