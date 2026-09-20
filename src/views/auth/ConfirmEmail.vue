<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AxiosError } from 'axios';
import { confirmEmailApi } from '@/api/auth.api';
import ImpressumModal from '@/components/modals/ImpressumModal.vue';
import DatenschutzModal from '@/components/modals/DatenschutzModal.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const error = ref('');
const showImpressum = ref(false);
const showDatenschutz = ref(false);

onMounted(async () => {
  const hash = route.query.hash;

  if (!hash || typeof hash !== 'string') {
    error.value = 'Der Bestätigungslink ist unvollständig oder ungültig.';
    loading.value = false;
    return;
  }

  try {
    await confirmEmailApi(hash);
    success.value = true;
  } catch (err) {
    const axiosError = err as AxiosError<{ errors?: { hash?: string } }>;
    error.value =
      axiosError.response?.data?.errors?.hash === 'invalidHash'
        ? 'Der Bestätigungslink ist ungültig oder abgelaufen.'
        : 'Die E-Mail-Adresse konnte nicht bestätigt werden. Möglicherweise wurde der Link bereits verwendet.';
  } finally {
    loading.value = false;
  }
});
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
                  <!-- Ladezustand -->
                  <div v-if="loading" class="text-center py-4">
                    <CSpinner color="primary" />
                    <p class="text-body-secondary mt-3">
                      E-Mail-Adresse wird bestätigt…
                    </p>
                  </div>

                  <!-- Erfolg -->
                  <div v-else-if="success">
                    <h1>E-Mail bestätigt</h1>
                    <p class="text-body-secondary">
                      Vielen Dank, deine E-Mail-Adresse wurde erfolgreich
                      bestätigt. Bevor du dich anmelden kannst, muss dein
                      Konto noch von einem Administrator freigeschaltet
                      werden.
                    </p>
                    <CButton
                      color="primary"
                      class="mt-2"
                      @click="router.push('/auth/login')"
                    >
                      Zur Anmeldung
                    </CButton>
                  </div>

                  <!-- Fehler -->
                  <div v-else>
                    <h1>Bestätigung fehlgeschlagen</h1>
                    <CAlert color="danger" class="mb-3">
                      {{ error }}
                    </CAlert>
                    <CButton
                      color="primary"
                      class="mt-2"
                      @click="router.push('/auth/login')"
                    >
                      Zur Anmeldung
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol :xs="12" :md="5">
              <CCard class="text-white bg-primary py-5 h-100">
                <CCardBody
                  class="text-center d-flex flex-column justify-content-center"
                >
                  <h2>Fast geschafft</h2>
                  <p>
                    Nach der Bestätigung deiner E-Mail-Adresse muss dein Konto
                    noch von der Verwaltung freigeschaltet werden.
                  </p>
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
