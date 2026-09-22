import type { AuditLogFilter } from '@/api/audit-log.api';

/**
 * Fünf Kategorien für die Sortierleiste im Aktivitätsprotokoll, entlang der
 * fachlichen Hauptfunktionen der Anwendung:
 *  - Termine & Kalender (Einzel- und Serientermine)
 *  - Räume & Ressourcen (Stammdaten + Buchungen)
 *  - Benutzerverwaltung
 *  - Anmeldung & Sicherheit
 *  - System & Automatisierung (Cron-Jobs, Ferien-Import, kritische Fehler)
 *
 * `filterParams` wird 1:1 als Query-Parameter an GET /audit-log angehängt.
 * "System & Automatisierung" filtert bewusst über entityType statt service,
 * da dort sowohl service=reorganization (Ferien-Import) als auch
 * service=system (Systemfehler) hineingehören - beide tragen aber immer
 * entityType 'system', ein einzelner Filterwert reicht also aus.
 */
export interface AuditLogCategory {
  key: string;
  label: string;
  color: string;
  filterParams: AuditLogFilter;
}

export const AUDIT_LOG_CATEGORIES: AuditLogCategory[] = [
  {
    key: 'events',
    label: 'Termine',
    color: 'success',
    filterParams: { service: 'events' },
  },
  {
    key: 'resources',
    label: 'Ressourcen',
    color: 'info',
    filterParams: { service: 'resources' },
  },
  {
    key: 'users',
    label: 'Benutzerverwaltung',
    color: 'primary',
    filterParams: { service: 'users' },
  },
  {
    key: 'auth',
    label: 'Anmeldung & Sicherheit',
    color: 'warning',
    filterParams: { service: 'auth' },
  },
  {
    key: 'system',
    label: 'System & Automatisierung',
    color: 'secondary',
    filterParams: { entityType: 'system' },
  },
];

export const SERVICE_LABELS: Record<string, string> = {
  events: 'Events',
  resources: 'Ressourcen',
  users: 'Nutzerverwaltung',
  auth: 'Auth',
  reorganization: 'Reorg-Service',
  system: 'System',
};

export function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service;
}

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Angelegt',
  UPDATE: 'Bearbeitet',
  DELETE: 'Gelöscht',
  REGISTERED: 'Registriert',
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login fehlgeschlagen',
  LOGOUT: 'Logout',
  USER_ACTIVATED: 'Freigeschaltet',
  ROLE_CHANGED: 'Rolle geändert',
  PASSWORD_CHANGED: 'Passwort geändert',
  PASSWORD_RESET_REQUESTED: 'Passwort-Reset angefordert',
  HOLIDAYS_IMPORTED: 'Ferien importiert',
  SYSTEM_ERROR: 'Systemfehler',
  SERIES_GENERATED: 'Serie generiert',
  SERIES_MODIFIED: 'Serie geändert',
  OWNER_CHANGED: 'Besitzer geändert',
  CALENDAR_PRINTED: 'Kalender gedruckt',
  REORGANIZATION_RUN: 'Reorg-Lauf',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Alle Aktionen für den Aktions-Dropdown-Filter, gruppiert wie im Backend-Enum. */
export const ALL_ACTIONS = Object.keys(ACTION_LABELS);

const CRITICAL_ACTIONS = new Set(['SYSTEM_ERROR', 'LOGIN_FAILED']);

/** Soll dieser Eintrag in der Tabelle optisch als kritisch hervorgehoben werden? */
export function isCriticalEntry(action: string): boolean {
  return CRITICAL_ACTIONS.has(action);
}

export function actionColor(action: string): string {
  if (action === 'SYSTEM_ERROR') return 'danger';
  if (action === 'LOGIN_FAILED') return 'danger';
  if (action === 'DELETE') return 'danger';
  if (action === 'CREATE' || action === 'REGISTERED') return 'success';
  if (action === 'UPDATE' || action === 'ROLE_CHANGED' || action === 'OWNER_CHANGED')
    return 'warning';
  if (action === 'USER_ACTIVATED') return 'success';
  if (action === 'CALENDAR_PRINTED' || action === 'REORGANIZATION_RUN')
    return 'info';
  return 'secondary';
}

export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Tablet' | 'Mobil';
}

/**
 * Grober User-Agent-Parser ohne externe Abhängigkeit. Deckt die gängigen
 * Browser/Betriebssysteme ab, die im UA-String der Client-Requests
 * auftauchen - für exotischere/ältere UAs bleibt "Unbekannt" als Fallback.
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent;

  let browser = 'Unbekannt';
  if (/Edg\//.test(ua)) {
    browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''}`.trim();
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = `Opera ${ua.match(/(?:OPR|Opera)\/([\d.]+)/)?.[1] ?? ''}`.trim();
  } else if (/Firefox\//.test(ua)) {
    browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`.trim();
  } else if (/Chrome\//.test(ua)) {
    browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`.trim();
  } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
    browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}`.trim();
  }

  let os = 'Unbekannt';
  if (/Windows NT 10\.0/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android ([\d.]+)/.test(ua)) os = `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}`.trim();
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let deviceType: ParsedUserAgent['deviceType'] = 'Desktop';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    deviceType = 'Tablet';
  } else if (/Mobile|iPhone|iPod|Android/.test(ua)) {
    deviceType = 'Mobil';
  }

  return { browser, os, deviceType };
}

/**
 * Deutsche Labels für die "Feld"-Spalte im Änderungs-Diff der Log-Detail-
 * Ansicht. Deckt die Felder ab, die über AuditLogService.diff() aus den
 * verschiedenen Modulen (Termine, Serien, Räume, Ressourcen, Nutzer, ...)
 * tatsächlich in changes landen können. Unbekannte Felder fallen in
 * fieldLabel() auf den Rohnamen zurück.
 */
export const FIELD_LABELS: Record<string, string> = {
  title: 'Titel',
  description: 'Beschreibung',
  start: 'Start',
  end: 'Ende',
  allDay: 'Ganztägig',
  isBackground: 'Hintergrund-Termin',
  roomid: 'Raum',
  categoryid: 'Kategorie',
  seriesid: 'Serientermin',
  createdbyid: 'Erstellt von',
  frequency: 'Wiederholung',
  startTime: 'Startzeit',
  endTime: 'Endzeit',
  seriesStart: 'Serienbeginn',
  seriesEnd: 'Serienende',
  weekdays: 'Wochentage',
  runDuringSchoolHolidays: 'Auch während der Ferien',
  active: 'Aktiv',
  lastGeneratedUntil: 'Generiert bis',
  lastReorganizationAt: 'Letzte Reorganisation',
  resourceid: 'Ressource',
  color: 'Farbe',
  avm_id: 'AVM-Geräte-/Gruppen-ID',
  comfort_temp: 'Komforttemperatur',
  empty_temp: 'Absenktemperatur',
  prelim_time: 'Aufheiz-Zeitraum (Min.)',
  heated: 'Heizung aktiv',
  hidden: 'Ausgeblendet',
  locationid: 'AVM-Standort',
  manager_email: 'Verwalter-E-Mail',
  inventoryid: 'Inventarnummer',
  email: 'E-Mail',
  password: 'Passwort',
  provider: 'Anmeldeart',
  socialId: 'Social-ID',
  firstName: 'Vorname',
  lastName: 'Nachname',
  role: 'Rolle',
  status: 'Status',
  userFunction: 'Funktion',
  affectedCalendarEvents: 'Betroffene Einzeltermine',
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Feste Kategorie-IDs (siehe HolidayReorganizationService/EventModal im
 *  Backend/Frontend) - es gibt aktuell kein Backend-Endpoint, das
 *  Kategorien auflistet, die Menge ist bewusst klein und statisch. */
export const CATEGORY_NAMES: Record<number, string> = {
  1: 'Standard',
  2: 'Gottesdienst',
  9999: 'Ferien/Feiertag',
};

export function categoryName(id: number): string {
  return CATEGORY_NAMES[id] ?? `Kategorie #${id}`;
}

/** Rollen-IDs wie in Users.vue/EditUserModal.vue verwendet. */
export const ROLE_NAMES: Record<number, string> = {
  1: 'Admin',
  2: 'Benutzer',
  3: 'Verwaltung',
  4: 'Gast',
};

/** Status-IDs wie in EditUserModal.vue verwendet. */
export const STATUS_NAMES: Record<number, string> = {
  1: 'Aktiv',
  2: 'Inaktiv',
  3: 'Ausstehend',
  4: 'Blockiert',
};

export const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Wöchentlich',
  BIWEEKLY: 'Zweiwöchentlich',
};

/** Wochentag wie in SeriesEvent.weekdays verwendet (JS-Konvention: 0=Sonntag...6=Samstag,
 *  siehe CalendarView.vue, wo `new Date(...).getDay()` direkt als weekday gesendet wird).
 *  7 wird zusätzlich als Sonntag erkannt, für ältere Datensätze in ISO-Konvention. */
export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'So',
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  7: 'So',
};

/** Felder, deren Wert ein Datum/Zeitstempel ist und daher im deutschen
 *  Format (statt als rohes ISO-Datum) dargestellt werden soll. */
export const DATE_FIELDS = new Set([
  'start',
  'end',
  'seriesStart',
  'seriesEnd',
  'lastGeneratedUntil',
  'lastReorganizationAt',
]);

/** Felder mit reinem true/false-Wert -> "Ja"/"Nein" statt "true"/"false". */
export const BOOLEAN_FIELDS = new Set([
  'allDay',
  'isBackground',
  'runDuringSchoolHolidays',
  'active',
  'heated',
  'hidden',
]);

/** Felder, deren Zahlenwert eine ID einer anderen Entität ist, mit Angabe,
 *  welche Referenzliste (siehe AuditLogDetailModal) zum Auflösen genutzt
 *  werden soll. */
export const ID_REFERENCE_FIELDS: Record<
  string,
  'room' | 'user' | 'resource' | 'series' | 'avmLocation' | 'category'
> = {
  roomid: 'room',
  createdbyid: 'user',
  resourceid: 'resource',
  seriesid: 'series',
  locationid: 'avmLocation',
  categoryid: 'category',
};
