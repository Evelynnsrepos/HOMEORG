import type { Task } from './types';

export function frequencyLabel(t: Task): string {
  if (t.kind === 'once') return 'One-off';
  if (t.kind === 'whenever') return 'Whenever';
  const { every, unit } = t;
  if (unit === 'day') {
    if (every === 1) return 'Daily';
    if (every === 7) return 'Weekly';
    return `Every ${every} days`;
  }
  if (unit === 'week') {
    if (every === 1) return 'Weekly';
    if (every === 2) return 'Fortnightly';
    return `Every ${every} weeks`;
  }
  if (unit === 'month') {
    if (every === 1) return 'Monthly';
    if (every === 3) return 'Quarterly';
    if (every === 6) return 'Twice a year';
    return `Every ${every} months`;
  }
  return every === 1 ? 'Yearly' : `Every ${every} years`;
}

export function shortFrequency(t: Task): string {
  return frequencyLabel(t).toUpperCase();
}

export function minutesLabel(m: number): string {
  return `${m}m`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
