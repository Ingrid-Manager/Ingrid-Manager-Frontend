export function parseDateStringToISO(s: string): string | null {
  s = String(s).trim();

  if (!s) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  const dm = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);

  if (dm) {
    const day = dm[1].padStart(2, '0');

    const month = dm[2].padStart(2, '0');

    let year = dm[3];

    if (year.length === 2) {
      year = String(2000 + Number(year));
    }

    return `${year}-${month}-${day}`;
  }

  const d = new Date(s);

  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return null;
}
