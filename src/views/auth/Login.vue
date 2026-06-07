<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref('');

const form = ref({
  email: '',
  password: '',
});

// Clear error when user edits input
watch(
  form,
  () => {
    error.value = '';
  },
  { deep: true },
);

const submit = async () => {
  error.value = '';
  loading.value = true;

  // client-side input validation
  if (!form.value.email || !form.value.password) {
    error.value = 'Bitte geben Sie E-Mail und Passwort ein.';
    loading.value = false;
    return;
  }

  try {
    await auth.login(form.value.email, form.value.password);
    router.push('/');
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message;
    } else {
      error.value = 'Anmeldung fehlgeschlagen.';
    }
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
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <CForm @submit.prevent="submit">
                  <h1>Anmeldung</h1>
                  <p class="text-body-secondary">
                    Melden Sie sich mit Ihren Zugangsdaten an.
                  </p>
                  <CAlert v-if="error" color="danger" class="mb-3" dismissible>
                    {{ error }}
                  </CAlert>
                  <CInputGroup class="mb-3">
                    <CInputGroupText>
                      <CIcon icon="cil-user" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="form.email"
                      placeholder="E-Mail Adresse"
                      autocomplete="email"
                      :invalid="!!error"
                    />
                  </CInputGroup>
                  <CInputGroup class="mb-4">
                    <CInputGroupText>
                      <CIcon icon="cil-lock-locked" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="form.password"
                      type="password"
                      placeholder="Passwort"
                      autocomplete="current-password"
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
                        {{ loading ? 'Anmeldevorgang...' : 'Anmelden' }}
                      </CButton>
                    </CCol>
                    <CCol :xs="6" class="text-right">
                      <CButton color="link" class="px-0" @click="router.push('/auth/forgot-password')">
                        Passwort vergessen?
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
            <CCard class="text-white bg-primary py-5" style="width: 44%">
              <CCardBody class="text-center">
                <div>
                  <h2>Registrieren</h2>
                  <p>
                    Sie können sich hier registrieren, müssen aber vor der
                    Verwendung des Ingrid Managers von der Verwaltung
                    freigeschaltet werden!
                  </p>
                  <CButton color="light" variant="outline" class="mt-3" @click="router.push('/auth/register')">
                    Registrieren
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>
