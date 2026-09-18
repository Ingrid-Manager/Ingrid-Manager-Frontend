<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { AuditLogEntry } from '@/api/audit-log.api';
import {
  actionLabel,
  actionColor,
  serviceLabel,
  parseUserAgent,
  fieldLabel,
  categoryName,
  ROLE_NAMES,
  STATUS_NAMES,
  FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  DATE_FIELDS,
  BOOLEAN_FIELDS,
  ID_REFERENCE_FIELDS,
} from '@/helper/audit-log/audit-log-meta';
import { getRoomNames } from '@/api/getRoomNames';
import { getUsers } from '@/api/users/getUsers';
import { getResourceNames } from '@/api/getResourceNames';
import { getAvmLocations } from '@/api/avmLocations.api';
import { getAllSeriesEvents } from '@/api/series/getAllSeriesEvents';

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

const isCreation = computed(
  () => props.entry?.action === 'CREATE' || props.entry?.action === 'REGISTERED',
);

// ─── Referenzdaten zum Auflösen von IDs (Raum/Nutzer/Ressource/Serie/AVM-
// Standort) auf lesbare Namen. Werden einmal geladen, sobald diese
// Komponente gemountet wird (bleibt über mehrere Modal-Öffnungen hinweg
// im Speicher, da Logs.vue sie dauerhaft rendert statt per v-if).
const roomNames = ref<Map<number, string>>(new Map());
const userNames = ref<Map<number, string>>(new Map());
const resourceNames = ref<Map<number, string>>(new Map());
const seriesNames = ref<Map<number, string>>(new Map());
const avmLocationNames = ref<Map<number, string>>(new Map());

onMounted(async () => {
  const [rooms, users, resources, series, locations] = await Promise.allSettled([
    getRoomNames(),
    getUsers(),
    getResourceNames(),
    getAllSeriesEvents(),
    getAvmLocations(),
  ]);

  if (rooms.status === 'fulfilled') {
    roomNames.value = new Map(rooms.value.map((r) => [r.id, r.title]));
  }
  if (users.status === 'fulfilled') {
    userNames.value = new Map(
      users.value.map((u) => [
        u.id,
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email,
      ]),
    );
  }
  if (resources.status === 'fulfilled') {
    resourceNames.value = new Map(resources.value.map((r) => [r.id, r.title]));
  }
  if (series.status === 'fulfilled') {
    seriesNames.value = new Map(series.value.map((s) => [s.id, s.title]));
  }
  if (locations.status === 'fulfilled') {
    avmLocationNames.value = new Map(locations.value.map((l) => [l.id, l.title]));
  }
});

/** Löst eine Referenz-ID (Raum/Nutzer/Ressource/Serie/AVM-Standort/
 *  Kategorie) über die geladenen Referenzdaten in einen Namen auf. */
function resolveReference(field: string, value: unknown): string | null {
  const refType = ID_REFERENCE_FIELDS[field];
  if (!refType || typeof value !== 'number') {
    return null;
  }

  switch (refType) {
    case 'category':
      return categoryName(value);
    case 'room':
      return roomNames.value.get(value) ?? `#${value}`;
    case 'user':
      return userNames.value.get(value) ?? `#${value}`;
    case 'resource':
      return resourceNames.value.get(value) ?? `#${value}`;
    case 'series':
      return seriesNames.value.get(value) ?? `#${value}`;
    case 'avmLocation':
      return avmLocationNames.value.get(value) ?? `#${value}`;
  }
}

/** Löst role/status-Objekte (nur { id } oder das volle { id, name }) auf. */
function resolveRoleOrStatus(field: string, value: Record<string, unknown>): string | null {
  if (typeof value.name === 'string') {
    return value.name;
  }
  if (typeof value.id === 'number') {
    const names = field === 'role' ? ROLE_NAMES : STATUS_NAMES;
    return names[value.id] ?? `#${value.id}`;
  }
  return null;
}

function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (DATE_FIELDS.has(field) && typeof value === 'string') {
    return formatTimestamp(value);
  }

  if (BOOLEAN_FIELDS.has(field) && typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein';
  }

  if (field === 'frequency' && typeof value === 'string') {
    return FREQUENCY_LABELS[value] ?? value;
  }

  if (field === 'weekdays' && Array.isArray(value)) {
    return value.map((day) => WEEKDAY_LABELS[Number(day)] ?? day).join(', ');
  }

  const resolved = resolveReference(field, value);
  if (resolved !== null) {
    return resolved;
  }

  if ((field === 'role' || field === 'status') && typeof value === 'object') {
    const resolvedRoleOrStatus = resolveRoleOrStatus(
      field,
      value as Record<string, unknown>,
    );
    if (resolvedRoleOrStatus !== null) {
      return resolvedRoleOrStatus;
    }
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

const changeRows = computed(() => {
  if (!props.entry?.changes) {
    return [];
  }
  return Object.entries(props.entry.changes).map(([field, change]) => ({
    field,
    label: fieldLabel(field),
    old: formatChangeValue(field, change.old),
    new: formatChangeValue(field, change.new),
  }));
});

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
        <strong class="d-block mb-2">
          {{ isCreation ? 'Erfasste Daten' : 'Geänderte Felder' }}
        </strong>
        <CTable bordered small class="mb-0">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Feld</CTableHeaderCell>
              <CTableHeaderCell v-if="!isCreation">Vorher</CTableHeaderCell>
              <CTableHeaderCell>{{ isCreation ? 'Wert' : 'Nachher' }}</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="row in changeRows" :key="row.field">
              <CTableDataCell class="text-nowrap">{{ row.label }}</CTableDataCell>
              <CTableDataCell v-if="!isCreation" class="small text-danger">{{ row.old }}</CTableDataCell>
              <CTableDataCell class="small text-success">{{ row.new }}</CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </div>
      <div v-else class="text-medium-emphasis small">
        Für diesen Eintrag liegen keine weiteren Daten vor.
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" @click="handleClose">Schließen</CButton>
    </CModalFooter>
  </CModal>
</template>
