# Ingrid-Manager – Frontend

> Eine webbasierte Anwendung zur Verwaltung von Räumen, Veranstaltungen und Ressourcen, gebaut mit Vue 3, FullCalendar und CoreUI.
>
> 🌐 [ingrid-manager.de](https://ingrid-manager.de)

![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646cff?logo=vite&logoColor=white)
![Lizenz: AGPL v3](https://img.shields.io/badge/Lizenz-AGPL%20v3-blue.svg)

---

## Übersicht

Ingrid-Manager ist ein Open-Source-Frontend zur Verwaltung von Räumen, Ressourcen und Kalenderterminen – geeignet für Organisationen wie Kirchengemeinden, Vereine oder Gemeinschaftszentren. Weitere Informationen findest du unter [ingrid-manager.de](https://ingrid-manager.de). Die Kommunikation mit dem Backend erfolgt über JWT-gesicherte REST-API-Aufrufe.

---

## Funktionen

- Interaktiver Kalender (Monats-, Wochen-, Tages- und Listenansicht) auf Basis von FullCalendar
- Termine erstellen, bearbeiten und löschen
- Serien-Termine mit RRULE-Unterstützung
- Raumverwaltung mit farbcodierter Sidebar-Filterung und dynamischen Raumlisten
- Ressourcenbuchungskalender und Ressourcenverwaltung
- Rollenbasierte Zugriffskontrolle (Admin, Verwaltung, Benutzer, Gast)
- Benutzerverwaltung
- Anwendungseinstellungen (Organisation, SMTP, Heizperioden, Locations)
- Aktivitäten-Log
- Gottesdienstplanungstabelle
- Authentifizierung via JWT
- Responsives Design mit Mobilunterstützung
- Hell- / Dunkel- / Auto-Theme

---

## Verwendete Technologien

### Frontend

| Bereich | Technologie |
|---------|-------------|
| Framework | Vue 3 (Composition API) |
| Build-Tool | Vite 7 |
| Sprache | TypeScript 5 |
| State Management | Pinia |
| Routing | Vue Router 4 |
| UI-Komponenten | CoreUI Vue 5 |
| Kalender | FullCalendar 6 |
| HTTP-Client | Axios |

### Entwicklung

| Bereich | Technologie |
|---------|-------------|
| Linting | ESLint 9 + TypeScript ESLint |
| Formatierung | Prettier 3 |
| Typprüfung | vue-tsc |
| CSS | SCSS |

---

## Voraussetzungen

- **Node.js** >= 20
- **npm** >= 10
- Eine laufende Instanz des [Ingrid-Manager Backends](https://github.com/Ingrid-Manager), welches die REST-API bereitstellt

---

## Installation & Einrichtung

### 1. Repository klonen

```bash
git clone https://github.com/Ingrid-Manager/DEV_IngridManagerFrontend.git
cd DEV_IngridManagerFrontend
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env.local`-Datei im Projektstamm:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Ersetze die URL durch die Adresse deiner Backend-Instanz.

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:4000` erreichbar.

---

## Verfügbare Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Typprüfung durchführen und für Produktion bauen |
| `npm run preview` | Produktions-Build lokal vorschauen |
| `npm run type-check` | TypeScript-Typprüfung ausführen |
| `npm run lint` | ESLint ausführen |
| `npm run lint:fix` | ESLint mit automatischer Korrektur ausführen |
| `npm run format` | Alle Dateien mit Prettier formatieren |

---

## Projektstruktur

```
src/
├── api/                  # Axios-API-Aufrufe (Auth, Events, Räume, Benutzer)
├── assets/               # Icons und statische Dateien
├── components/
│   └── modals/           # Wiederverwendbare Modal-Komponenten (EventModal, RoomModal, …)
├── composables/          # Vue Composables (useEventForm)
├── helper/
│   ├── calendar/         # RRule-Hilfsfunktionen, Datumsparser
│   ├── interfaces/       # TypeScript-Interfaces
│   └── mapper/           # Datenmapper Backend ↔ Frontend
├── layouts/              # App-Layout-Wrapper (DefaultLayout, CalenderView)
├── router/               # Vue-Router-Konfiguration und Auth-Guard
├── stores/               # Pinia Stores (Auth, Theme)
├── styles/               # Globale SCSS-Dateien (Layout, Kalender, CoreUI-Overrides)
└── views/
    ├── admin/            # Benutzerverwaltung, Räume, Einstellungen, Thermostate, Logs
    ├── auth/             # Login, Registrierung, Passwort vergessen
    ├── calendar/         # Hauptkalenderansicht
    ├── dashboard/        # Dashboard (bindet CalendarView ein)
    └── ressourcen/       # Ressourcenkalender und -verwaltung
```

---

## Authentifizierung

Die Authentifizierung erfolgt per JWT. Nach dem Login wird das Access Token im `localStorage` gespeichert und über einen Axios-Request-Interceptor an alle API-Anfragen angehängt. Ein weiterer Interceptor übernimmt das automatische Erneuern des Tokens bei 401-Antworten des Backends.

---

## Rollenmodell

| Rolle | Berechtigungen |
|-------|---------------|
| `admin` | Vollzugriff auf alle Funktionen |
| `verwaltung` | Verwaltungszugriff, kann alle Termine verwalten |
| `user` | Kann eigene Termine erstellen und bearbeiten |
| `guest` | Nur Lesezugriff |

---

## Kalenderfunktionen

- Monats-, Wochen-, Tages- und Listenansicht
- Termine erstellen und bearbeiten
- Raumzuweisung bei der Terminerfassung
- Serien-Termine mit benutzerdefinierten Wiederholungen (wöchentlich, 14-tägig, monatlich)
- Dynamisches Laden der Events über die API
- Farbcodierte Raumlegende mit Filterung

---

## API

Das Frontend kommuniziert mit dem Backend über REST-Endpunkte. Wichtige Endpunkte:

```
POST   /auth/email/login
POST   /auth/email/register
POST   /auth/logout
GET    /auth/me
POST   /calendar-events/range
POST   /calendar-events
PATCH  /calendar-events
DELETE /calendar-events/:id
GET    /rooms/names
GET    /users
PATCH  /users/:id
```

---

## Mithelfen & Beitragen

Beiträge sind herzlich willkommen! So kannst du mitmachen:

1. Repository forken
2. Feature-Branch erstellen (`git checkout -b feature/mein-feature`)
3. Änderungen committen (`git commit -m 'Mein Feature hinzufügen'`)
4. Branch pushen (`git push origin feature/mein-feature`)
5. Pull Request öffnen

Bitte stelle sicher, dass dein Code Linting und Typprüfung besteht, bevor du einen Pull Request einreichst:

```bash
npm run lint
npm run type-check
```

---

## Lizenz

Dieses Projekt steht unter der **GNU Affero General Public License v3 (AGPL v3)**.

Das bedeutet:
- Der Quellcode ist frei einsehbar, nutzbar und veränderbar
- Wer den Code weitergibt oder verändert, muss das Ergebnis ebenfalls unter AGPL v3 veröffentlichen
- Wer die Software als Dienst im Netzwerk betreibt, muss den Quellcode ebenfalls öffentlich zugänglich machen
- Eine kommerzielle Nutzung ohne Offenlegung des Quellcodes ist **nicht** gestattet
- Der Urheberrechtshinweis und die Autorennennung müssen erhalten bleiben
- Es wird **keine Haftung** übernommen

Details siehe [LICENSE](LICENSE) oder [gnu.org/licenses/agpl-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

---

### Drittanbieter-Komponenten

Dieses Projekt enthält modifizierte Bestandteile des [CoreUI Free Vue Admin Template](https://github.com/coreui/coreui-free-vue-admin-template), lizenziert unter der MIT-Lizenz.

Alle projektspezifischen Erweiterungen und die Businesslogik unterliegen der AGPL v3.
