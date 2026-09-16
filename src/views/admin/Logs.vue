<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { getAuditLog } from '@/api/audit-log.api';
import type { AuditLogEntry, AuditLogFilter } from '@/api/audit-log.api';
import {
  AUDIT_LOG_CATEGORIES,
  ALL_ACTIONS,
  actionLabel,
  actionColor,
  serviceLabel,
  isCriticalEntry,
} from '@/helper/audit-log/audit-log-meta';
import AuditLogDetailModal from '@/components/modals/AuditLogDetailModal.vue';

const auth = useAuthStore();
const canAccess = computed(
  () =>
    auth.user?.role?.name === 'admin' || auth.user?.role?.name === 'verwaltung',
);

const PAGE_SIZE = 100;

const entries = ref<AuditLogEntry[]>([]);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const errorMessage = ref('');

const activeCategory = ref('');
const actionFilter = ref('');
const fromFilter = ref('');
const toFilter = ref('');

const detailModalVisible = ref(false);
const selectedEntry = ref<AuditLogEntry | null>(null);

async function loadPage(targetPage: number) {
  loading.value = true;
  errorMessage.value = '';

  const category = AUDIT_LOG_CATEGORIES.find((c) => c.key === activeCategory.value);

  const filter: AuditLogFilter = {
    page: targetPage,
    limit: PAGE_SIZE,
    ...(category?.filterParams ?? {}),
  };

  if (actionFilter.value) {
    filter.action = actionFilter.value;
  }
  if (fromFilter.value) {
    filter.from = fromFilter.value;
  }
  if (toFilter.value) {
    filter.to = toFilter.value;
  }

  try {
    const result = await getAuditLog(filter);
    entries.value = result.data;
    page.value = result.page;
    totalPages.value = Math.max(result.totalPages, 1);
    total.value = result.total;
  } catch (err) {
    console.error('Fehler beim Laden des Aktivitätsprotokolls:', err);
    errorMessage.value = 'Aktivitätsprotokoll konnte nicht geladen werden.';
    entries.value = [];
  } finally {
    loading.value = false;
  }
}

function goToPage(targetPage: number | 'ellipsis') {
  if (
    targetPage === 'ellipsis' ||
    targetPage < 1 ||
    targetPage > totalPages.value ||
    targetPage === page.value
  ) {
    return;
  }
  // Nur die angeklickte Seite wird nachgeladen - keine anderen Seiten werden vorab geholt.
  loadPage(targetPage);
}

function selectCategory(key: string) {
  activeCategory.value = activeCategory.value === key ? '' : key;
}

// Filterwechsel setzt immer auf Seite 1 zurück und lädt neu.
watch([activeCategory, actionFilter, fromFilter, toFilter], () => {
  loadPage(1);
});

const visiblePages = computed(() => {
  const totalP = totalPages.value;
  const current = page.value;

  if (totalP <= 7) {
    return Array.from({ length: totalP }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalP, current]);
  for (let offset = 1; offset <= 2; offset++) {
    if (current - offset >= 1) pages.add(current - offset);
    if (current + offset <= totalP) pages.add(current + offset);
  }

  return Array.from(pages).sort((a, b) => a - b);
});

/** Seitenzahlen mit 'ellipsis'-Markern für Lücken, z.B. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]. */
const paginationItems = computed<(number | 'ellipsis')[]>(() => {
  const pages = visiblePages.value;
  const items: (number | 'ellipsis')[] = [];

  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(p);
  });

  return items;
});

function openDetail(entry: AuditLogEntry) {
  selectedEntry.value = entry;
  detailModalVisible.value = true;
}

function closeDetail() {
  detailModalVisible.value = false;
  selectedEntry.value = null;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
}

onMounted(() => {
  if (canAccess.value) {
    loadPage(1);
  }
});
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">
      <CAlert v-if="!canAccess" color="danger" class="mb-3">
        Für diesen Bereich benötigst du die Rolle Admin oder Verwaltung.
      </CAlert>

      <template v-else>
        <CAlert
          v-if="errorMessage"
          color="danger"
          class="mb-3"
          dismissible
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </CAlert>

        <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
          <CCardHeader
            class="d-flex justify-content-between align-items-center flex-wrap gap-2"
          >
            <strong>Aktivitätsprotokoll</strong>

            <div class="d-flex gap-2 flex-wrap align-items-center">
              <CButtonGroup>
                <CButton
                  v-for="category in AUDIT_LOG_CATEGORIES"
                  :key="category.key"
                  size="sm"
                  :color="category.color"
                  :variant="activeCategory !== category.key ? 'outline' : ''"
                  @click="selectCategory(category.key)"
                >
                  {{ category.label }}
                </CButton>
              </CButtonGroup>

              <CFormSelect v-model="actionFilter" size="sm" style="width: 190px">
                <option value="">Alle Aktionen</option>
                <option v-for="action in ALL_ACTIONS" :key="action" :value="action">
                  {{ actionLabel(action) }}
                </option>
              </CFormSelect>

              <div class="d-flex align-items-center gap-1">
                <span class="small text-medium-emphasis">Von</span>
                <CFormInput
                  v-model="fromFilter"
                  type="date"
                  size="sm"
                  style="width: 150px"
                />
              </div>
              <div class="d-flex align-items-center gap-1">
                <span class="small text-medium-emphasis">Bis</span>
                <CFormInput
                  v-model="toFilter"
                  type="date"
                  size="sm"
                  style="width: 150px"
                />
              </div>
            </div>
          </CCardHeader>

          <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
            <div v-if="loading" class="d-flex justify-content-center align-items-center p-5">
              <CSpinner color="primary" />
              <span class="ms-3 text-medium-emphasis">Wird geladen…</span>
            </div>

            <div
              v-else-if="entries.length === 0"
              class="d-flex flex-column align-items-center justify-content-center p-5 text-medium-emphasis"
            >
              Keine Einträge gefunden.
            </div>

            <div v-else class="flex-grow-1 overflow-auto">
              <CTable hover class="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Zeitpunkt</CTableHeaderCell>
                    <CTableHeaderCell>Nutzer</CTableHeaderCell>
                    <CTableHeaderCell>Aktion</CTableHeaderCell>
                    <CTableHeaderCell class="d-none d-md-table-cell">Bereich</CTableHeaderCell>
                    <CTableHeaderCell>Zusammenfassung</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  <CTableRow
                    v-for="entry in entries"
                    :key="entry.id"
                    :color="isCriticalEntry(entry.action) ? 'danger' : undefined"
                    style="cursor: pointer"
                    @click="openDetail(entry)"
                  >
                    <CTableDataCell>
                      <code class="small">{{ formatTimestamp(entry.createdAt) }}</code>
                    </CTableDataCell>
                    <CTableDataCell class="small">
                      {{ entry.userLabel ?? 'System' }}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge :color="actionColor(entry.action)">
                        {{ actionLabel(entry.action) }}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell class="small text-medium-emphasis d-none d-md-table-cell">
                      {{ serviceLabel(entry.service) }}
                    </CTableDataCell>
                    <CTableDataCell class="small">
                      {{ entry.summary }}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>

          <CCardFooter
            class="d-flex justify-content-between align-items-center flex-wrap gap-2"
          >
            <span class="text-medium-emphasis small">
              {{ total }} {{ total === 1 ? 'Eintrag' : 'Einträge' }} gesamt · Seite
              {{ page }} von {{ totalPages }}
            </span>

            <CPagination v-if="totalPages > 1" size="sm" class="mb-0">
              <CPaginationItem :disabled="page === 1" @click="goToPage(page - 1)">
                Zurück
              </CPaginationItem>
              <template v-for="(item, idx) in paginationItems" :key="idx">
                <CPaginationItem v-if="item === 'ellipsis'" disabled>…</CPaginationItem>
                <CPaginationItem
                  v-else
                  :active="item === page"
                  @click="goToPage(item)"
                >
                  {{ item }}
                </CPaginationItem>
              </template>
              <CPaginationItem
                :disabled="page === totalPages"
                @click="goToPage(page + 1)"
              >
                Weiter
              </CPaginationItem>
            </CPagination>
          </CCardFooter>
        </CCard>
      </template>
    </div>

    <AuditLogDetailModal
      :visible="detailModalVisible"
      :entry="selectedEntry"
      @close="closeDetail"
    />
  </div>
</template>
