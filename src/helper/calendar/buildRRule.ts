export function buildRRule(
  repeatType: '' | 'weekly' | 'biweekly' | 'monthly',
  endSeriesDate: string,
): string {

  if (!endSeriesDate) {
    return '';
  }

  if (repeatType == '') {
    return '';
  }

  const until =
    endSeriesDate.replaceAll('-', '') +
    'T235959';

  switch (repeatType) {

    case 'weekly':
      return `FREQ=WEEKLY;UNTIL=${until}`;

    case 'biweekly':
      return `FREQ=WEEKLY;INTERVAL=2;UNTIL=${until}`;

    case 'monthly':
      return `FREQ=MONTHLY;UNTIL=${until}`;

    default:
      return '';
  }
}