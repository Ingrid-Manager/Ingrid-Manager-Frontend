import http from '@/api/http';

export type PrintViewType = 'week' | 'month' | 'year';

export interface PrintCalendarPayload {
  type: PrintViewType;
  date: string; // ISO-Datum, z. B. "2026-06-15"
  roomIds?: number[];
}

/**
 * Stößt die PDF-Erzeugung im Backend an. Das PDF selbst kommt NICHT vom
 * Backend zurück — stattdessen liefert das Backend eine Download-URL, die
 * direkt auf den externen PDF-Server zeigt (spart eine komplette
 * Datenübertragung über den Backend-Server). Der Browser lädt das PDF
 * anschließend direkt von dort herunter (siehe downloadFromUrl()).
 */
export async function printCalendar(
  payload: PrintCalendarPayload,
): Promise<{ downloadUrl: string }> {
  const response = await http.post('/calendar-events/print', payload);
  return response.data;
}

/**
 * Stößt den Browser-Download einer (ggf. fremden/externen) URL an.
 * Funktioniert auch Cross-Origin (z. B. pdf.ingrid-manager.de, während
 * die App selbst auf ingrid-manager.de läuft): Ein einfacher
 * Link-Klick/Navigation unterliegt — anders als ein per JavaScript
 * gelesener fetch()/XHR-Request — nicht den CORS-Beschränkungen des
 * Browsers, daher ist hierfür keine CORS-Konfiguration auf dem
 * PDF-Server nötig. Der Dateiname kommt vom Content-Disposition-Header,
 * den der PDF-Server setzt.
 */
export function downloadFromUrl(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();

  // Element erst leicht verzögert wieder entfernen: Ein sofortiges
  // Entfernen direkt nach click() kann in manchen Browsern den gerade
  // erst gestarteten Download abbrechen (derselbe Effekt wie bei einem
  // zu früh aufgerufenen URL.revokeObjectURL() bei Blob-Downloads) —
  // mit echten, größeren PDFs beobachtet: Datei kam nur mit wenigen KB
  // an und war dadurch nicht lesbar.
  setTimeout(() => {
    document.body.removeChild(link);
  }, 1000);
}
