<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(false);
const error = ref('');
const success = ref(false);

const form = ref({
  'forgot-password-firstname': '',
  'forgot-password-email': '',
});

watch(
  form,
  () => {
    error.value = '';
  },
  { deep: true },
);

const submit = async () => {
  //ToDo
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
                  <!-- Erfolgsmeldung -->
                  <div v-if="success">
                    <h1>E-Mail verschickt</h1>
                    <p class="text-body-secondary">
                      Wir haben Ihnen eine E-Mail mit einem Link zum Zurücksetzen
                      Ihres Passworts an
                      <strong>{{ form['forgot-password-email'] }}</strong> gesendet.
                      Bitte prüfen Sie auch Ihren Spam-Ordner.
                    </p>
                    <CButton
                      color="primary"
                      class="mt-2"
                      @click="router.push('/auth/login')"
                    >
                      Zurück zur Anmeldung
                    </CButton>
                  </div>

                  <!-- Formular -->
                  <CForm v-else @submit.prevent="submit">
                    <h1>Passwort vergessen?</h1>
                    <p class="text-body-secondary">
                      Geben Sie Ihren Vornamen und Ihre E-Mail-Adresse an. Sie
                      erhalten anschließend eine E-Mail mit einem Link zum
                      Zurücksetzen Ihres Passworts.
                    </p>

                    <CAlert v-if="error" color="danger" class="mb-3" dismissible>
                      {{ error }}
                    </CAlert>

                    <!-- Vorname -->
                    <CInputGroup class="mb-3">
                      <CInputGroupText>
                        <CIcon icon="cil-user" />
                      </CInputGroupText>
                      <CFormInput
                        id="forgot-password-firstname"
                        v-model="form['forgot-password-firstname']"
                        placeholder="Vorname"
                        autocomplete="given-name"
                        :invalid="!!error"
                      />
                    </CInputGroup>

                    <!-- E-Mail -->
                    <CInputGroup class="mb-4">
                      <CInputGroupText>@</CInputGroupText>
                      <CFormInput
                        id="forgot-password-email"
                        v-model="form['forgot-password-email']"
                        type="email"
                        placeholder="E-Mail Adresse"
                        autocomplete="email"
                        :invalid="!!error"
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol :xs="7">
                        <CButton
                          color="primary"
                          class="px-4"
                          type="submit"
                          :disabled="loading"
                        >
                          {{ loading ? 'Wird gesendet…' : 'Passwort zurücksetzen' }}
                        </CButton>
                      </CCol>
                      <CCol :xs="5" class="text-end">
                        <CButton
                          color="link"
                          class="px-0"
                          @click="router.push('/auth/login')"
                        >
                          Zurück zur Anmeldung
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
                  <h2>Passwort vergessen?</h2>
                  <p>
                    Kein Problem. Geben Sie Ihren Vornamen und Ihre
                    E-Mail-Adresse an und wir senden Ihnen einen Link zum
                    Zurücksetzen Ihres Passworts zu.
                  </p>
                  <CButton
                    color="light"
                    variant="outline"
                    class="mt-3"
                    @click="router.push('/auth/login')"
                  >
                    Zurück zur Anmeldung
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