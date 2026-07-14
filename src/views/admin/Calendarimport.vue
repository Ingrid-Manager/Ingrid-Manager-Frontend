<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';

import { getRoomNames } from '@/api/getRoomNames';
import { fetchEvents } from '@/api/getCalendar';
import { createEvent } from '@/api/createEvent';

import type { RoomNames } from '@/helper/interfaces/room/RoomNames';
import type { CalendarEvent } from '@/helper/interfaces/calendar/CalendarEvent';

// Hinweis Rollen (siehe API-Overview.md): POST /calendar-events erfordert
// admin, verwaltung oder user. Diese Seite sollte über die Router-Route
// entsprechend abgesichert sein (wie eure anderen geschützten Views).

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusKind = 'ok' | 'err' | '';
type ImportPhase = 'idle' | 'checking' | 'ready' | 'sending';

interface RawExcelRow {
  Titel?: string;
  Datum?: string | number | Date;
  Uhrzeit?: string | number | Date;
  Veranstaltungsort?: string;
  Beschreibung?: string;
  [key: string]: unknown;
}

interface RowDisplay {
  title: string;
  start: Date;
  end: Date;
  roomTitle: string;
}

// Payload-Form für POST /calendar-events. createEvent() selbst nimmt
// bewusst `payload: unknown` entgegen – dieses Interface dient nur dazu,
// den Payload hier im Component typsicher zusammenzubauen.
interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  start: string; // ISO-8601
  end: string; // ISO-8601
  roomid: number;
  categoryid: number;
}

interface ValidRow {
  row: number;
  payload: CreateCalendarEventPayload;
  display: RowDisplay;
}

interface RowIssue {
  row: number;
  reason: string;
  data: unknown;
}

interface CreatedRow {
  row: number;
  title: string;
  start: Date;
  end: Date;
  roomTitle: string;
}

interface PendingImport {
  rows: RawExcelRow[];
  valid: ValidRow[];
  errors: RowIssue[];
  skipped: RowIssue[];
  categoryId: number;
}

// ─── Konfiguration ──────────────────────────────────────────────────────────

// Raum-Zuordnung: Excel-Ortstext -> Raumtitel (wie in der DB hinterlegt).
// Diese Liste bei Bedarf direkt hier erweitern (kein Redeploy des Backends nötig).
const ROOM_ALIASES: { keywords: string[]; roomTitle: string }[] = [
  { keywords: ['Pfarrgarten', 'Gemeindehaus Daverden'], roomTitle: 'Saal' },
  {
    keywords: ['St. Laurentius Kirche', 'Kirche Baden', 'St. Sigismund Kirche'],
    roomTitle: 'Kirche',
  },
  { keywords: ['Gemeindehaus Baden'], roomTitle: 'Großer Saal' },
  // Weitere Zuordnungen hier ergänzen, z.B.:
  // { keywords: ['gemeindehaus'], roomTitle: 'Gemeindehaus' },
];

const REQUIRED_COLUMNS: (keyof RawExcelRow)[] = ['Titel', 'Datum', 'Uhrzeit'];
const MAX_ROWS = 2000; // Sicherheits-Obergrenze, um den Tab nicht einzufrieren

// ─── State: Räume ───────────────────────────────────────────────────────────

const rooms = ref<RoomNames[]>([]);
const loadingRooms = ref(false);
const loadRoomsError = ref('');

// Interner (nicht darstellungsrelevanter) Lookup: normalisierter Titel -> Raum.
let roomsByNormalizedTitle = new Map<string, RoomNames>();

onMounted(async () => {
  loadingRooms.value = true;
  loadRoomsError.value = '';
  try {
    rooms.value = await getRoomNames();
    roomsByNormalizedTitle = new Map();
    rooms.value.forEach((r) => {
      if (r && typeof r.title === 'string')
        roomsByNormalizedTitle.set(normalize(r.title), r);
    });
  } catch (err) {
    console.error('Fehler beim Laden der Räume:', err);
    loadRoomsError.value =
      'Räume konnten nicht geladen werden. Bitte Seite neu laden.';
  } finally {
    loadingRooms.value = false;
  }
});

// ─── State: Einstellungen ───────────────────────────────────────────────────

// Feste Kategorie-Auswahl (kein Backend-Endpoint für Kategorien vorhanden).
// "Ferien" ist bewusst nicht Teil dieser Liste.
const CATEGORY_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: 'Standard' },
  { id: 2, label: 'Gottesdienst' },
];

const categoryId = ref<string>('2'); // Default: Gottesdienst

// ─── State: Upload / Import ─────────────────────────────────────────────────

const fileInputKey = ref(0); // Hochzählen erzwingt Neu-Mount des <input type="file"> (=Reset)
const selectedFile = ref<File | null>(null);
const sheetWarning = ref('');
const importStatus = ref<{ message: string; kind: StatusKind }>({
  message: '',
  kind: '',
});
const importPhase = ref<ImportPhase>('idle');

const pendingImport = ref<PendingImport | null>(null);
let importCancelled = false; // Soft-Cancel: wird vor dem nächsten Termin geprüft (siehe Hinweis unten)

const result = reactive({
  visible: false,
  total: 0,
  created: [] as CreatedRow[],
  errors: [] as RowIssue[],
  skipped: [] as RowIssue[],
  pendingValidCount: null as number | null,
});

// ─── Computed ───────────────────────────────────────────────────────────────

const importBtnLabel = computed(() => {
  switch (importPhase.value) {
    case 'checking':
      return 'Prüfe …';
    case 'ready':
      return `${pendingImport.value ? pendingImport.value.valid.length : 0} Termin(e) jetzt anlegen`;
    case 'sending':
      return 'Import läuft …';
    default:
      return 'Datei prüfen';
  }
});

const importBtnDisabled = computed(() => {
  if (loadingRooms.value) return true;
  if (importPhase.value === 'checking' || importPhase.value === 'sending')
    return true;
  if (importPhase.value === 'ready')
    return !pendingImport.value || pendingImport.value.valid.length === 0;
  return !selectedFile.value; // idle
});

const showCancelBtn = computed(() => importPhase.value === 'sending');

const okCountLabel = computed(() =>
  result.pendingValidCount !== null ? 'Bereit zum Anlegen' : 'Angelegt',
);
const okCount = computed(() =>
  result.pendingValidCount !== null
    ? result.pendingValidCount
    : result.created.length,
);

function alertColor(kind: StatusKind) {
  if (kind === 'ok') return 'success';
  if (kind === 'err') return 'danger';
  return 'info';
}

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function normalize(text: unknown): string {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Umlaute/Akzente grob glätten
    .trim();
}

function describeRequestError(err: unknown): string {
  const anyErr = err as {
    response?: {
      status?: number;
      data?: { message?: string; errors?: unknown };
    };
    message?: string;
  };
  if (anyErr?.response?.data) {
    const body = anyErr.response.data;
    if (typeof body.message === 'string') return body.message;
    if (body.errors) return JSON.stringify(body.errors);
  }
  return anyErr?.message || 'Unbekannter Fehler';
}

function requestStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

// Liefert { room, ambiguous, candidates }. "ambiguous:true" bedeutet: mehr als
// ein Raum passt per Substring-Vergleich -> Zeile MUSS als Fehler markiert
// werden statt automatisch (und ggf. falsch) den ersten Treffer zu nehmen.
function resolveRoom(locationText: unknown): {
  room: RoomNames | null;
  ambiguous: boolean;
  candidates: RoomNames[];
} {
  const norm = normalize(locationText);
  if (!norm) return { room: null, ambiguous: false, candidates: [] };

  for (const alias of ROOM_ALIASES) {
    if (alias.keywords.some((kw) => norm.includes(normalize(kw)))) {
      const room = roomsByNormalizedTitle.get(normalize(alias.roomTitle));
      if (room) return { room, ambiguous: false, candidates: [room] };
    }
  }

  const matches: RoomNames[] = [];
  for (const [normTitle, room] of roomsByNormalizedTitle.entries()) {
    if (norm.includes(normTitle) || normTitle.includes(norm))
      matches.push(room);
  }
  if (matches.length === 1)
    return { room: matches[0], ambiguous: false, candidates: matches };
  if (matches.length > 1)
    return { room: null, ambiguous: true, candidates: matches };
  return { room: null, ambiguous: false, candidates: [] };
}

// Excel liefert Datum/Uhrzeit je nach Zellformat entweder als JS-Date
// (bei cellDates:true) oder als Bruchteils-/Ganzzahl-Seriennummer.
function excelSerialToDate(serial: number): Date {
  // Excel-Epoche: 30.12.1899
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMs);
}

// Extrahiert {y, m, d} unabhängig von der Ursprungsform des Werts.
// WICHTIG: SheetJS (cellDates:true) und excelSerialToDate() bauen Date-Objekte
// über UTC-Millisekunden auf. Würde man hier lokale Getter (getFullYear() etc.)
// verwenden, verschiebt sich das Datum je nach Zeitzone des Browsers um einen Tag.
// Nur bei Strings, die wir selbst über den lokalen Date-Konstruktor bauen
// (parseGermanOrIsoDate), sind lokale Getter korrekt.
function extractDateParts(
  dateVal: unknown,
): { y: number; m: number; d: number } | null {
  if (dateVal instanceof Date) {
    return {
      y: dateVal.getUTCFullYear(),
      m: dateVal.getUTCMonth(),
      d: dateVal.getUTCDate(),
    };
  }
  if (typeof dateVal === 'number') {
    const d = excelSerialToDate(dateVal);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
  }
  if (typeof dateVal === 'string') {
    const parsed = parseGermanOrIsoDate(dateVal);
    if (!parsed) return null;
    return {
      y: parsed.getFullYear(),
      m: parsed.getMonth(),
      d: parsed.getDate(),
    };
  }
  return null;
}

// Extrahiert {h, mi}. Zeit-Zellen von SheetJS sind ebenfalls UTC-basierte
// Date-Objekte -> UTC-Getter. Reine Zahlenbrüche (Tagesanteil) sind
// zeitzonenunabhängig.
function extractTimeParts(timeVal: unknown): { h: number; mi: number } | null {
  if (timeVal instanceof Date) {
    return { h: timeVal.getUTCHours(), mi: timeVal.getUTCMinutes() };
  }
  if (typeof timeVal === 'number') {
    const totalMinutes = Math.round(timeVal * 24 * 60);
    return { h: Math.floor(totalMinutes / 60) % 24, mi: totalMinutes % 60 };
  }
  if (typeof timeVal === 'string') {
    const m = timeVal.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return { h: parseInt(m[1], 10), mi: parseInt(m[2], 10) };
  }
  return null;
}

function combineDateAndTime(dateVal: unknown, timeVal: unknown): Date | null {
  const dp = extractDateParts(dateVal);
  if (!dp) return null;
  const tp = extractTimeParts(timeVal);
  if (!tp) return null;

  // Die kombinierten Werte werden bewusst über den LOKALEN Date-Konstruktor
  // gebaut: wir gehen davon aus, dass Datum/Uhrzeit in der Excel-Datei die
  // lokale Wanduhrzeit der Organisation meinen (z.B. Europe/Berlin).
  const combined = new Date(dp.y, dp.m, dp.d, tp.h, tp.mi, 0, 0);
  return isNaN(combined.getTime()) ? null : combined;
}

function parseGermanOrIsoDate(str: string): Date | null {
  let m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/); // TT.MM.JJJJ
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})/); // ISO
  if (m)
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
    );
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(date: Date): string {
  return date.toLocaleString('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Minuten-genauer Vergleichsschlüssel für "identisches Datum + Uhrzeit"
// (Sekunden/Millisekunden-Rauschen wird ignoriert).
function toMinuteKey(dateOrMs: Date | number): number {
  const ms = dateOrMs instanceof Date ? dateOrMs.getTime() : dateOrMs;
  return Math.floor(ms / 60000);
}

// fetchEvents() liefert bereits über mapBackendEvent gemappte CalendarEvent-
// Objekte. Der Start wird hier defensiv gelesen (Date ODER ISO-String), damit
// die Komponente nicht bricht, falls sich das genaue Feldformat mal ändert.
function extractEventStart(evt: CalendarEvent): Date | null {
  const raw = (evt as unknown as { start?: unknown }).start;
  if (raw === undefined || raw === null) return null;
  const d = raw instanceof Date ? raw : new Date(raw as string | number);
  return isNaN(d.getTime()) ? null : d;
}

// Prüft GENAU EINEN Termin auf ein Backend-Duplikat: schmales Zeitfenster
// (±5 Minuten um die Startzeit) statt eines großen Bereichs über die ganze
// Datei. Dadurch ist die Prüfung unabhängig von etwaigen Limits/Cutoffs bei
// größeren Zeiträumen und pro Termin eindeutig nachvollziehbar.
// 1 Tag statt weniger Minuten: das Backend scheint bei sehr schmalen
// Zeitfenstern die Range-Query-Parameter mit einem Zeitzonen-Versatz zu
// verarbeiten (vermutlich TypeORM/mysql2-Treiber, der Date-Parameter in
// Server-Lokalzeit statt UTC serialisiert). Bei einem breiten Fenster fällt
// das nicht ins Gewicht, bei ±5 Minuten schiebt es das Fenster komplett am
// Termin vorbei (beobachtet: 0 Treffer trotz bekanntermaßen existierendem
// Termin). Der anschließende Abgleich bleibt trotzdem minutengenau exakt.
const DUPLICATE_CHECK_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 Tag vor/nach der Startzeit

async function isDuplicateInBackend(start: Date): Promise<boolean> {
  const windowStart = new Date(start.getTime() - DUPLICATE_CHECK_WINDOW_MS);
  const windowEnd = new Date(start.getTime() + DUPLICATE_CHECK_WINDOW_MS);

  const events = await fetchEvents(
    windowStart.toISOString(),
    windowEnd.toISOString(),
  );
  const targetKey = toMinuteKey(start);

  return events.some((evt) => {
    const d = extractEventStart(evt);
    return d ? toMinuteKey(d) === targetKey : false;
  });
}

// Prüft alle Zeilen (Pflichtfelder, Datum/Zeit, Raumzuordnung) OHNE etwas
// an das Backend zu senden. Damit sieht der Nutzer vor dem eigentlichen
// Import, was passieren würde ("Dry Run").
function validateRows(
  rows: RawExcelRow[],
  catId: number,
): { valid: ValidRow[]; errors: RowIssue[]; skipped: RowIssue[] } {
  const valid: ValidRow[] = [];
  const errors: RowIssue[] = [];
  const skipped: RowIssue[] = [];
  const seenStarts = new Map<number, number>(); // Start-Zeitstempel (ms) -> Zeilennummer des ersten Vorkommens

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // Zeile 1 = Header
    const row = rows[i];

    const missing = REQUIRED_COLUMNS.filter(
      (c) => row[c] === null || row[c] === undefined || row[c] === '',
    );
    if (missing.length > 0) {
      errors.push({
        row: rowNum,
        reason: 'Fehlende Pflichtfelder: ' + missing.join(', '),
        data: row,
      });
      continue;
    }

    const start = combineDateAndTime(row['Datum'], row['Uhrzeit']);
    if (!start) {
      errors.push({
        row: rowNum,
        reason: 'Datum/Uhrzeit konnte nicht gelesen werden.',
        data: row,
      });
      continue;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const roomResult = resolveRoom(row['Veranstaltungsort']);
    if (roomResult.ambiguous) {
      errors.push({
        row: rowNum,
        reason:
          'Mehrdeutige Raumzuordnung für "' +
          (row['Veranstaltungsort'] || '') +
          '" (passt zu: ' +
          roomResult.candidates.map((r) => r.title).join(', ') +
          ') – bitte manuell klären.',
        data: row,
      });
      continue;
    }
    if (!roomResult.room) {
      errors.push({
        row: rowNum,
        reason:
          'Veranstaltungsort nicht zuordenbar: "' +
          (row['Veranstaltungsort'] || '') +
          '"',
        data: row,
      });
      continue;
    }
    const room = roomResult.room;

    // Duplikat-Prüfung: identisches Datum + Uhrzeit (Start) innerhalb der
    // Datei -> Zeile überspringen (nicht anlegen), unabhängig von Titel/Raum.
    const startKey = toMinuteKey(start);
    if (seenStarts.has(startKey)) {
      skipped.push({
        row: rowNum,
        reason:
          'Übersprungen: identisches Datum/Uhrzeit (' +
          fmt(start) +
          ') wie Zeile ' +
          seenStarts.get(startKey) +
          '.',
        data: row,
      });
      continue;
    }
    seenStarts.set(startKey, rowNum);

    valid.push({
      row: rowNum,
      payload: {
        title: String(row['Titel']),
        description: row['Beschreibung']
          ? String(row['Beschreibung'])
          : undefined,
        start: start.toISOString(),
        end: end.toISOString(),
        roomid: room.id,
        categoryid: catId,
      },
      display: {
        title: String(row['Titel']),
        start,
        end,
        roomTitle: room.title,
      },
    });
  }

  return { valid, errors, skipped };
}

function renderResult(
  total: number,
  created: CreatedRow[],
  errors: RowIssue[],
  skipped: RowIssue[],
  pendingValidCount?: number,
) {
  result.visible = true;
  result.total = total;
  result.created = created;
  result.errors = errors;
  result.skipped = skipped || [];
  result.pendingValidCount =
    typeof pendingValidCount === 'number' ? pendingValidCount : null;
}

// ─── Event-Handler ──────────────────────────────────────────────────────────

// Datei-Auswahl geändert -> vorherige Prüfung verwerfen
function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0] ? target.files[0] : null;
  selectedFile.value = file;
  pendingImport.value = null;
  importPhase.value = 'idle';
  importStatus.value = { message: '', kind: '' };
  sheetWarning.value = '';
}

// Kategorie-ID nachträglich geändert -> Payload wäre veraltet, also neu prüfen lassen
watch(categoryId, () => {
  if (pendingImport.value) {
    pendingImport.value = null;
    importPhase.value = 'idle';
    importStatus.value = {
      message: 'Kategorie-ID geändert – bitte die Datei erneut prüfen.',
      kind: '',
    };
  }
});

// Soft-Cancel: createEvent() unterstützt kein AbortSignal, daher wird der
// laufende Request nicht hart abgebrochen, sondern der Import stoppt vor
// dem nächsten Termin.
function cancelImport() {
  importCancelled = true;
}

const showConfirmModal = ref(false);

async function onImportButtonClick() {
  // Phase 2: eine Prüfung liegt bereits vor -> Bestätigungs-Modal öffnen,
  // der eigentliche Import startet erst über confirmImport().
  if (pendingImport.value) {
    showConfirmModal.value = true;
    return;
  }

  // Phase 1: Datei einlesen und validieren (nur der Duplikat-Check spricht schon mit dem Backend).
  const catId = parseInt(categoryId.value, 10);

  if (!categoryId.value || isNaN(catId) || catId <= 0) {
    importStatus.value = {
      message: 'Bitte eine gültige Standard-Kategorie-ID (> 0) eintragen.',
      kind: 'err',
    };
    return;
  }
  if (!selectedFile.value) {
    importStatus.value = {
      message: 'Bitte zuerst eine .xlsx-Datei auswählen.',
      kind: 'err',
    };
    return;
  }

  importPhase.value = 'checking';
  importStatus.value = { message: 'Datei wird gelesen …', kind: '' };
  sheetWarning.value = '';

  try {
    const buffer = await selectedFile.value.arrayBuffer();
    // Bewusst OHNE { cellDates: true }: SheetJS würde Datum/Uhrzeit sonst in
    // JS-Date-Objekte umwandeln, was bei manchen Excel-Exporten (Datumssystem/
    // Rundung) zu einem Zeitversatz führen kann (beobachtet: -25h). Ohne
    // cellDates liefert sheet_to_json die rohen Excel-Serial-Zahlen, die
    // extractDateParts/extractTimeParts unten per reiner Arithmetik
    // (zeitzonenunabhängig) auswerten.
    const workbook = XLSX.read(buffer);

    if (workbook.SheetNames.length > 1) {
      sheetWarning.value =
        'Hinweis: Die Datei enthält ' +
        workbook.SheetNames.length +
        ' Tabellenblätter. ' +
        'Es wird nur das erste ("' +
        workbook.SheetNames[0] +
        '") verwendet.';
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<RawExcelRow>(sheet, { defval: null });

    if (rows.length === 0) {
      importStatus.value = {
        message: 'Die Datei enthält keine Datenzeilen.',
        kind: 'err',
      };
      importPhase.value = 'idle';
      return;
    }
    if (rows.length > MAX_ROWS) {
      importStatus.value = {
        message:
          'Die Datei hat ' +
          rows.length +
          ' Zeilen und überschreitet das Limit von ' +
          MAX_ROWS +
          '. Bitte die Datei aufteilen und in mehreren Durchgängen importieren.',
        kind: 'err',
      };
      importPhase.value = 'idle';
      return;
    }

    const {
      valid: candidateValid,
      errors,
      skipped: fileSkipped,
    } = validateRows(rows, catId);

    let valid = candidateValid;
    let skipped = fileSkipped;

    if (candidateValid.length > 0) {
      const stillValid: ValidRow[] = [];
      const backendSkipped: RowIssue[] = [];

      for (let i = 0; i < candidateValid.length; i++) {
        const item = candidateValid[i];
        importStatus.value = {
          message: `Prüfe Termin ${i + 1} von ${candidateValid.length} auf Duplikate im Backend …`,
          kind: '',
        };
        try {
          const isDup = await isDuplicateInBackend(item.display.start);
          if (isDup) {
            backendSkipped.push({
              row: item.row,
              reason:
                'Übersprungen: Im Backend existiert bereits ein Termin mit identischem Datum/Uhrzeit (' +
                fmt(item.display.start) +
                ').',
              data: item.display,
            });
          } else {
            stillValid.push(item);
          }
        } catch (dupErr) {
          // Duplikat-Check ist ein Zusatz-Schutz, kein Muss: bei Fehlern (z.B.
          // unerwartetes API-Format) wird NICHT stillschweigend weitergemacht,
          // sondern die Prüfung abgebrochen, damit keine ungeprüften Duplikate entstehen.
          throw new Error(
            'Duplikat-Check gegen das Backend fehlgeschlagen (Zeile ' +
              item.row +
              '): ' +
              describeRequestError(dupErr),
          );
        }
      }

      valid = stillValid;
      skipped = fileSkipped.concat(backendSkipped);
    }

    pendingImport.value = { rows, valid, errors, skipped, categoryId: catId };

    renderResult(rows.length, [], errors, skipped, valid.length);
    importStatus.value = {
      message:
        'Prüfung abgeschlossen: ' +
        valid.length +
        ' von ' +
        rows.length +
        ' Zeilen sind bereit, ' +
        skipped.length +
        ' übersprungen (Duplikate), ' +
        errors.length +
        ' haben Fehler. ' +
        'Bitte prüfen und danach den Import bestätigen.',
      kind: valid.length > 0 ? 'ok' : 'err',
    };
    importPhase.value = 'ready';
  } catch (e) {
    importStatus.value = {
      message: 'Fehler beim Lesen der Datei: ' + describeRequestError(e),
      kind: 'err',
    };
    importPhase.value = 'idle';
  }
}

function confirmImport() {
  showConfirmModal.value = false;
  if (pendingImport.value) void runImport(pendingImport.value);
}

async function runImport(pending: PendingImport) {
  importCancelled = false;
  importPhase.value = 'sending';

  const created: CreatedRow[] = [];
  const errors: RowIssue[] = pending.errors.slice(); // bereits bei der Prüfung erkannte Fehler übernehmen

  for (let i = 0; i < pending.valid.length; i++) {
    if (importCancelled) {
      importStatus.value = {
        message:
          'Abgebrochen nach ' +
          i +
          ' von ' +
          pending.valid.length +
          ' Termin(en).',
        kind: 'err',
      };
      break;
    }

    const item = pending.valid[i];
    importStatus.value = {
      message:
        'Lege Termin ' + (i + 1) + ' von ' + pending.valid.length + ' an …',
      kind: '',
    };

    try {
      await createEvent(item.payload);
      created.push({
        row: item.row,
        title: item.display.title,
        start: item.display.start,
        end: item.display.end,
        roomTitle: item.display.roomTitle,
      });
    } catch (err) {
      const status = requestStatus(err);
      if (status === 409) {
        errors.push({
          row: item.row,
          reason:
            'Terminüberschneidung im Raum "' + item.display.roomTitle + '".',
          data: item.display,
        });
      } else {
        errors.push({
          row: item.row,
          reason:
            'API-Fehler' +
            (status ? ' (' + status + ')' : '') +
            ': ' +
            describeRequestError(err),
          data: item.display,
        });
      }
    }
  }

  renderResult(pending.rows.length, created, errors, pending.skipped);
  if (!importCancelled)
    importStatus.value = { message: 'Import abgeschlossen.', kind: 'ok' };

  pendingImport.value = null;
  importPhase.value = 'idle';
  selectedFile.value = null;
  fileInputKey.value++; // erzwingt Neu-Mount des Datei-Inputs (=Reset der Auswahl)
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-3">
    <div class="w-100" style="max-width: 1200px">
      <h1 class="h4 mb-1">Kalender-Import aus Excel</h1>
      <p class="text-medium-emphasis mb-4">
        Lädt Termine aus einer .xlsx-Datei (Spalten:
        <em>Titel, Datum, Uhrzeit, Veranstaltungsort, Beschreibung</em>) direkt
        in den Kalender.<br />
        Dies ist komplett abgestimmt auf die Datei für den Termin-Import bei
        <a
          href="https://www.termine-e.de"
          target="_blank"
          rel="noopener noreferrer"
          >www.termine-e.de</a
        >.
      </p>

      <!-- Ladeindikator (Räume) -->
      <div
        v-if="loadingRooms"
        class="d-flex justify-content-center align-items-center p-5"
      >
        <CSpinner color="primary" />
        <span class="ms-3 text-medium-emphasis">Räume werden geladen…</span>
      </div>

      <CAlert v-if="loadRoomsError" color="danger" class="mb-3">
        {{ loadRoomsError }}
      </CAlert>

      <template v-if="!loadingRooms && !loadRoomsError">
        <!-- Einstellungen -->
        <CCard class="mb-4">
          <CCardHeader><strong>Einstellungen</strong></CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="4">
                <CFormSelect
                  id="categoryId"
                  v-model="categoryId"
                  label="Kategorie"
                >
                  <option
                    v-for="opt in CATEGORY_OPTIONS"
                    :key="opt.id"
                    :value="String(opt.id)"
                  >
                    {{ opt.label }}
                  </option>
                </CFormSelect>
              </CCol>
            </CRow>
            <div class="form-text">
              Alle importierten Termine erhalten diese Kategorie.
            </div>
          </CCardBody>
        </CCard>

        <!-- Datei importieren -->
        <CCard class="mb-4">
          <CCardHeader><strong>Datei importieren</strong></CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md="6">
                <CFormInput
                  :key="fileInputKey"
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  label=".xlsx-Datei"
                  @change="onFileChange"
                />
              </CCol>
            </CRow>
            <div v-if="sheetWarning" class="form-text">{{ sheetWarning }}</div>

            <div class="d-flex gap-2 align-items-center flex-wrap mt-3">
              <CButton
                color="primary"
                :disabled="importBtnDisabled"
                @click="onImportButtonClick"
              >
                {{ importBtnLabel }}
              </CButton>
              <CButton
                v-if="showCancelBtn"
                color="secondary"
                variant="outline"
                @click="cancelImport"
              >
                Abbrechen
              </CButton>
            </div>

            <CAlert
              v-if="importStatus.message"
              :color="alertColor(importStatus.kind)"
              class="mt-3 mb-0"
            >
              {{ importStatus.message }}
            </CAlert>
          </CCardBody>
        </CCard>

        <!-- Bestätigungs-Dialog vor dem eigentlichen Import -->
        <CModal :visible="showConfirmModal" @close="showConfirmModal = false">
          <CModalHeader>
            <CModalTitle>Import bestätigen</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Es werden jetzt
            <strong>{{
              pendingImport ? pendingImport.valid.length : 0
            }}</strong>
            Termin(e) im Backend angelegt. Fortfahren?
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="outline"
              @click="showConfirmModal = false"
              >Abbrechen</CButton
            >
            <CButton color="primary" @click="confirmImport"
              >Termine anlegen</CButton
            >
          </CModalFooter>
        </CModal>

        <!-- Ergebnis -->
        <CCard v-if="result.visible" class="mb-4">
          <CCardHeader><strong>Ergebnis</strong></CCardHeader>
          <CCardBody>
            <CRow class="text-center g-3 mb-2">
              <CCol xs="6" md="3">
                <div class="fs-4 fw-bold">{{ result.total }}</div>
                <div class="small text-medium-emphasis">Zeilen gesamt</div>
              </CCol>
              <CCol xs="6" md="3">
                <div class="fs-4 fw-bold">{{ okCount }}</div>
                <div class="small text-medium-emphasis">{{ okCountLabel }}</div>
              </CCol>
              <CCol xs="6" md="3">
                <div class="fs-4 fw-bold">{{ result.skipped.length }}</div>
                <div class="small text-medium-emphasis">
                  Übersprungen (Duplikat)
                </div>
              </CCol>
              <CCol xs="6" md="3">
                <div class="fs-4 fw-bold">{{ result.errors.length }}</div>
                <div class="small text-medium-emphasis">Fehler</div>
              </CCol>
            </CRow>

            <div v-if="result.created.length" class="overflow-auto mt-3">
              <CTable hover small class="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Zeile</CTableHeaderCell>
                    <CTableHeaderCell>Titel</CTableHeaderCell>
                    <CTableHeaderCell>Start</CTableHeaderCell>
                    <CTableHeaderCell>Ende</CTableHeaderCell>
                    <CTableHeaderCell>Raum</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow
                    v-for="c in result.created"
                    :key="'created-' + c.row"
                  >
                    <CTableDataCell>{{ c.row }}</CTableDataCell>
                    <CTableDataCell>{{ c.title }}</CTableDataCell>
                    <CTableDataCell>{{ fmt(c.start) }}</CTableDataCell>
                    <CTableDataCell>{{ fmt(c.end) }}</CTableDataCell>
                    <CTableDataCell>{{ c.roomTitle }}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            <div v-if="result.skipped.length" class="overflow-auto mt-3">
              <CTable hover small class="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Zeile</CTableHeaderCell>
                    <CTableHeaderCell>Grund</CTableHeaderCell>
                    <CTableHeaderCell>Rohdaten</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="s in result.skipped" :key="'skip-' + s.row">
                    <CTableDataCell>{{ s.row }}</CTableDataCell>
                    <CTableDataCell
                      ><CBadge color="warning" class="me-1">Übersprungen</CBadge
                      >{{ s.reason }}</CTableDataCell
                    >
                    <CTableDataCell class="small text-medium-emphasis">{{
                      JSON.stringify(s.data)
                    }}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            <div v-if="result.errors.length" class="overflow-auto mt-3">
              <CTable hover small class="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Zeile</CTableHeaderCell>
                    <CTableHeaderCell>Grund</CTableHeaderCell>
                    <CTableHeaderCell>Rohdaten</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="e in result.errors" :key="'err-' + e.row">
                    <CTableDataCell>{{ e.row }}</CTableDataCell>
                    <CTableDataCell
                      ><CBadge color="danger" class="me-1">Fehler</CBadge
                      >{{ e.reason }}</CTableDataCell
                    >
                    <CTableDataCell class="small text-medium-emphasis">{{
                      JSON.stringify(e.data)
                    }}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      </template>
    </div>
  </div>
</template>
