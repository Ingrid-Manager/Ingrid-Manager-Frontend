<script setup lang="ts">
import { computed } from 'vue';
import type { AuditLogEntry } from '@/api/audit-log.api';
import {
  actionLabel,
  actionColor,
  serviceLabel,
  parseUserAgent,
} from '@/helper/audit-log/audit-log-meta';

const props = defineProps<{
  visible: boolean;
  entry: AuditLogEntry | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function handleClose() {
  emit('close');
}

const parsedUserAgent = computed(() =>
  props.entry?.userAgent ? parseUserAgent(props.entry.userAgent) : null,
);

const changeRows = computed(() => {
  if (!props.entry?.changes) {
    return [];
  }
  return Object.entries(props.entry.changes).map(([field, change]) => ({
    field,
    old: formatValue(change.old),
    new: formatValue(change.new),
  }));
});

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
}
</script>

<template>
  <CModal size="lg" :visible="visible" @close="handleClose">
    <CModalHeader>
      <CModalTitle>Aktivität im Detail</CModalTitle>
    </CModalHeader>

    <CModalBody v-if="entry">
      <dl class="row mb-4">
        <dt class="col-sm-3">Zeitpunkt</dt>
        <dd class="col-sm-9">{{ formatTimestamp(entry.createdAt) }}</dd>

        <dt class="col-sm-3">Nutzer</dt>
        <dd class="col-sm-9">{{ entry.userLabel ?? 'System' }}</dd>

        <dt class="col-sm-3">Aktion</dt>
        <dd class="col-sm-9">
          <CBadge :color="actionColor(entry.action)">
            {{ actionLabel(entry.action) }}
          </CBadge>
        </dd>

        <dt class="col-sm-3">Bereich</dt>
        <dd class="col-sm-9">
          {{ serviceLabel(entry.service) }}
          <span class="text-medium-emphasis">
            ({{ entry.entityType }}{{ entry.entityId ? ' #' + entry.entityId : '' }})
          </span>
        </dd>

        <dt class="col-sm-3">Zusammenfassung</dt>
        <dd class="col-sm-9">{{ entry.summary }}</dd>

        <template v-if="entry.ip || entry.userAgent">
          <dt class="col-sm-3">Herkunft</dt>
          <dd class="col-sm-9 small text-medium-emphasis">
            <div v-if="entry.ip">IP: {{ entry.ip }}</div>
            <div v-if="parsedUserAgent">
              {{ parsedUserAgent.browser }} · {{ parsedUserAgent.os }} ·
              {{ parsedUserAgent.deviceType }}
            </div>
            <div v-if="entry.userAgent" class="text-truncate" :title="entry.userAgent">
              {{ entry.userAgent }}
            </div>
          </dd>
        </template>
      </dl>

      <div v-if="changeRows.length > 0">
        <strong class="d-block mb-2">Geänderte Felder</strong>
        <CTable bordered small class="mb-0">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Feld</CTableHeaderCell>
              <CTableHeaderCell>Vorher</CTableHeaderCell>
              <CTableHeaderCell>Nachher</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="row in changeRows" :key="row.field">
              <CTableDataCell class="text-nowrap">{{ row.field }}</CTableDataCell>
              <CTableDataCell class="small text-danger">{{ row.old }}</CTableDataCell>
              <CTableDataCell class="small text-success">{{ row.new }}</CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </div>
      <div v-else class="text-medium-emphasis small">
        Für diesen Eintrag liegen keine Feldänderungen vor.
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose">Schließen</CButton>
    </CModalFooter>
  </CModal>
</template>
