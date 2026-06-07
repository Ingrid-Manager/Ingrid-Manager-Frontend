export function parseRRule(rrule: string) {
  const result: Record<string, any> = {};

  rrule.split(';').forEach((part) => {
    const [key, value] = part.split('=');

    switch (key) {
      case 'FREQ':
        result.freq = value.toLowerCase();
        break;

      case 'INTERVAL':
        result.interval = Number(value);
        break;

      case 'UNTIL':
        result.until = new Date(
          value.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
            '$1-$2-$3T$4:$5:$6',
          ),
        );
        break;
    }
  });

  return result;
}