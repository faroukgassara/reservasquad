export const SLOT_STEP = 30;

export function timeToMinutes(label: string, kind: 'start' | 'end'): number {
  const [h, m] = label.split(':').map((x) => Number(x));
  if (kind === 'end' && h === 0 && m === 0) return 24 * 60;
  return h * 60 + m;
}

export function startTimeOptions(): string[] {
  const out: string[] = [];
  for (let mins = 8 * 60; mins <= 23 * 60 + 30; mins += SLOT_STEP) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
}

export function endTimeOptions(): string[] {
  const starts = startTimeOptions();
  return [...starts.slice(1), '00:00'];
}

export function validEndsForStart(start: string): string[] {
  const s = timeToMinutes(start, 'start');
  return endTimeOptions().filter((e) => timeToMinutes(e, 'end') > s);
}
