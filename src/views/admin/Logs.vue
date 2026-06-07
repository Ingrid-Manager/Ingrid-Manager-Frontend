<script setup>
import { ref, computed } from 'vue';
/* Beispiel .json Format einer Log Datei, um dann daraus die Ansicht für das Frontend zu erstellen.
    sonst auch jedes anderes Format, was sich gut parsen lässt.
[
  { "timestamp": "22.03.2026 10:01:03", "level": "INFO",    "source": "AppStart",    "message": "Server gestartet auf Port 3000" },
  { "timestamp": "22.03.2026 10:05:44", "level": "WARN",    "source": "DB",          "message": "Langsame Abfrage erkannt (1243ms)" },
  { "timestamp": "22.03.2026 10:07:18", "level": "ERROR",   "source": "AuthService", "message": "Login fehlgeschlagen für admin@example.com" },
  { "timestamp": "22.03.2026 10:11:00", "level": "TERMINE", "source": "DB",          "message": "Max Mustermann hat den Termin \"Chor Crescendo\" erstellt" }
]
*/
const logs = ref([
  {
    id: 1,
    timestamp: '22.03.2026 10:01:03',
    level: 'ERROR',
    source: 'DB',
    message: 'Insert Into konnte nicht ausgeführt werden',
  },
  {
    id: 2,
    timestamp: '22.03.2026 10:01:05',
    level: 'INFO',
    source: 'SMTP',
    message:
      'Daily Info Mail "neue / gelöschte Termine" wurde an Elisa Musterfrau verschickt',
  },
  {
    id: 3,
    timestamp: '22.03.2026 10:03:12',
    level: 'DEBUG',
    source: 'AuthService',
    message: 'Token validiert für user@example.com',
  },
  {
    id: 4,
    timestamp: '22.03.2026 10:05:44',
    level: 'WARN',
    source: 'DB',
    message: 'Langsame Abfrage erkannt (1243ms) – SELECT * FROM orders',
  },
  {
    id: 5,
    timestamp: '22.03.2026 10:07:18',
    level: 'ERROR',
    source: 'AuthService',
    message: 'Login fehlgeschlagen für admin@example.com (3 Versuche)',
  },
  {
    id: 6,
    timestamp: '22.03.2026 10:09:31',
    level: 'INFO',
    source: 'UserAPI',
    message: 'Neuer Nutzer registriert: id=2041',
  },
  {
    id: 7,
    timestamp: '22.03.2026 10:11:00',
    level: 'WARN',
    source: 'Cache',
    message: 'Cache Miss Rate > 40% – Überprüfung empfohlen',
  },
  {
    id: 8,
    timestamp: '22.03.2026 10:13:27',
    level: 'ERROR',
    source: 'PaymentSvc',
    message: 'Zahlung abgelehnt: Timeout bei Stripe-API (Request-ID: ch_3NxAB)',
  },
  {
    id: 9,
    timestamp: '22.03.2026 10:15:02',
    level: 'DEBUG',
    source: 'Router',
    message: 'GET /api/v1/products – 204ms – 200 OK',
  },
  {
    id: 10,
    timestamp: '22.03.2026 10:16:55',
    level: 'INFO',
    source: 'Scheduler',
    message: 'Cron-Job cleanup_sessions abgeschlossen (gelöscht: 312)',
  },
  {
    id: 11,
    timestamp: '22.03.2026 10:18:09',
    level: 'ERROR',
    source: 'FileUpload',
    message: 'Datei zu groß: 48MB (Limit: 10MB) – user_id=1772',
  },
  {
    id: 12,
    timestamp: '22.03.2026 10:19:44',
    level: 'WARN',
    source: 'MailSvc',
    message: 'E-Mail-Zustellung verzögert – SMTP Queue: 58 ausstehend',
  },
  {
    id: 13,
    timestamp: '22.03.2026 10:21:30',
    level: 'DEBUG',
    source: 'Middleware',
    message: 'CORS-Header gesetzt für Origin: https://app.example.com',
  },
  {
    id: 14,
    timestamp: '22.03.2026 10:23:11',
    level: 'TERMINE',
    source: 'DB',
    message: 'Max Mustermann hat den Termin "Chor Crescendo" erstellt',
  },
]);

const activeFilter = ref('ALL');
const searchQuery = ref('');

const levelColor = (level) => {
  switch (level) {
    case 'ERROR':
      return 'danger';
    case 'WARN':
      return 'warning';
    case 'INFO':
      return 'info';
    case 'DEBUG':
      return 'secondary';
    case 'TERMINE':
      return 'success';
    default:
      return 'light';
  }
};

/*
const countByLevel = (level) =>
  logs.value.filter(l => l.level === level).length
*/

const filteredLogs = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return logs.value.filter((l) => {
    const matchesLevel =
      activeFilter.value === 'ALL' || l.level === activeFilter.value;
    const matchesSearch =
      !q ||
      l.message.toLowerCase().includes(q) ||
      l.source.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });
});
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">
      <!-- Hauptkarte mit Tabelle -->
      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <CCardHeader
          class="d-flex justify-content-between align-items-center flex-wrap gap-2"
        >
          <strong>Logs</strong>

          <!-- Filter-Buttons -->
          <div class="d-flex gap-1 flex-wrap align-items-center">
            <CButtonGroup>
              <CButton
                size="sm"
                color="secondary"
                :variant="activeFilter !== 'ALL' ? 'outline' : ''"
                @click="activeFilter = 'ALL'"
              >
                Alle
              </CButton>
              <CButton
                size="sm"
                color="danger"
                :variant="activeFilter !== 'ERROR' ? 'outline' : ''"
                @click="activeFilter = 'ERROR'"
              >
                ERROR
              </CButton>
              <CButton
                size="sm"
                color="warning"
                :variant="activeFilter !== 'WARN' ? 'outline' : ''"
                @click="activeFilter = 'WARN'"
              >
                WARN
              </CButton>
              <CButton
                size="sm"
                color="warning"
                :variant="activeFilter !== 'INFO' ? 'outline' : ''"
                @click="activeFilter = 'INFO'"
              >
                INFO
              </CButton>
              <CButton
                size="sm"
                color="success"
                :variant="activeFilter !== 'TERMINE' ? 'outline' : ''"
                @click="activeFilter = 'TERMINE'"
              >
                TERMINE
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                :variant="activeFilter !== 'DEBUG' ? 'outline' : ''"
                @click="activeFilter = 'DEBUG'"
              >
                DEBUG
              </CButton>
            </CButtonGroup>

            <CFormInput
              v-model="searchQuery"
              size="sm"
              placeholder="Suche…"
              style="width: 180px"
            />
          </div>
        </CCardHeader>

        <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
          <div class="flex-grow-1 overflow-auto">
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Zeitstempel</CTableHeaderCell>
                  <CTableHeaderCell>Level</CTableHeaderCell>
                  <CTableHeaderCell>Service</CTableHeaderCell>
                  <CTableHeaderCell>Nachricht</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-if="filteredLogs.length === 0">
                  <CTableDataCell
                    colspan="5"
                    class="text-center text-medium-emphasis py-4"
                  >
                    Keine Einträge gefunden.
                  </CTableDataCell>
                </CTableRow>

                <CTableRow v-for="log in filteredLogs" :key="log.id">
                  <CTableDataCell>
                    <code class="small">{{ log.timestamp }}</code>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CBadge :color="levelColor(log.level)">
                      {{ log.level }}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell class="small text-medium-emphasis">
                    {{ log.source }}
                  </CTableDataCell>

                  <CTableDataCell class="small">
                    {{ log.message }}
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>

        <CCardFooter class="text-medium-emphasis small">
          {{ filteredLogs.length }} von {{ logs.length }} Einträgen angezeigt
        </CCardFooter>
      </CCard>
    </div>
  </div>
</template>
