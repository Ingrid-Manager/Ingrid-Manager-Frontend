import { ref, computed, watch } from 'vue';

export function useEventForm() {
  const form = ref({
    title: '',
    description: '',
    room: '',

    startTime: '',
    endTime: '',

    startDate: '',
    endDate: '',

    isSeries: false,
    frequency: 'WEEKLY' as 'WEEKLY' | 'BIWEEKLY',
    endSeriesDate: '',
    runDuringSchoolHolidays: false,

    // NEU: Benutzerdefinierte Termine
    customSeries: false,
  });

  // Liste der zusätzlichen, frei gewählten Einzeltermine
  const customDates = ref<{ id: number; value: string }[]>([]);

  // Freitext-Eingabe zum Massen-Import von Daten (z.B. per Copy&Paste)
  const datesText = ref('');

  const validated = ref(false);

  const showSeriesOptions = computed(() => form.value.isSeries);

  // Benutzerdefinierte Terminliste nur anzeigen, wenn "Serie" UND "Benutzerdefiniert" aktiv sind
  const showCustomDates = computed(
    () => form.value.isSeries && form.value.customSeries,
  );

  let nextId = 1;

  function addDateRow() {
    customDates.value.push({ id: nextId++, value: '' });
  }

  function removeDateRow(id: number) {
    customDates.value = customDates.value.filter((entry) => entry.id !== id);
  }

  // Erkennt deutsche Datumsformate: TT.MM.JJJJ, TT.MM.JJ, T.M.JJ, T.M.JJJJ ...
  // Getrennt durch Zeilenumbruch, Komma oder Semikolon.
  const GERMAN_DATE_REGEX = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/;

  function parseGermanDate(input: string): string | null {
    const match = input.trim().match(GERMAN_DATE_REGEX);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);

    if (match[3].length === 2) {
      // Zweistellige Jahresangabe -> 20xx annehmen
      year += 2000;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Auf echte Kalendergültigkeit prüfen (z.B. 31.02. abfangen)
    const check = new Date(year, month - 1, day);
    if (
      check.getFullYear() !== year ||
      check.getMonth() !== month - 1 ||
      check.getDate() !== day
    ) {
      return null;
    }

    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');

    return `${year}-${mm}-${dd}`;
  }

  function parseDatesFromText() {
    const parts = datesText.value
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    parts.forEach((part) => {
      const isoDate = parseGermanDate(part);
      if (isoDate) {
        customDates.value.push({ id: nextId++, value: isoDate });
      }
    });

    datesText.value = '';
  }

  // Serien-Optionen zurücksetzen, wenn "Termin ist Teil einer Serie" deaktiviert wird
  watch(
    () => form.value.isSeries,
    (val) => {
      if (!val) {
        form.value.frequency = 'WEEKLY';
        form.value.endSeriesDate = '';
        form.value.runDuringSchoolHolidays = false;
        form.value.customSeries = false;
        customDates.value = [];
        datesText.value = '';
      }
    },
  );

  // Benutzerdefinierte Terminliste leeren, wenn zurück auf "normale" Wiederholung gewechselt wird
  watch(
    () => form.value.customSeries,
    (val) => {
      if (!val) {
        customDates.value = [];
        datesText.value = '';
      }
    },
  );

  function resetForm() {
    form.value = {
      title: '',
      description: '',
      room: '',

      startTime: '',
      endTime: '',

      startDate: '',
      endDate: '',

      isSeries: false,
      frequency: 'WEEKLY',
      endSeriesDate: '',
      runDuringSchoolHolidays: false,

      customSeries: false,
    };

    customDates.value = [];
    datesText.value = '';
    validated.value = false;
  }

  return {
    form,

    customDates,
    datesText,

    validated,

    showSeriesOptions,
    showCustomDates,

    addDateRow,
    removeDateRow,
    parseDatesFromText,

    resetForm,
  };
}