export function parseResetRange(input, today = new Date().toISOString().slice(0, 10)) {
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  if (!input || !['all', 'from'].includes(input.scope)) return null;
  if (input.scope === 'all') return { scope: 'all', from: null, through: null };
  const through = input.through ?? today;
  // Client's local today may differ from UTC by one calendar day.
  const latest = new Date(`${today}T12:00:00Z`); latest.setUTCDate(latest.getUTCDate() + 1);
  if (!validDate(input.from) || !validDate(through) || input.from > through || through > latest.toISOString().slice(0, 10)) return null;
  return { scope: 'from', from: input.from, through };
}
