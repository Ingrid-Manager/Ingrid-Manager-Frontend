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
  if (action === 'UPDATE' || action === 'ROLE_CHANGED') return 'warning';
  if (action === 'USER_ACTIVATED') return 'success';
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
