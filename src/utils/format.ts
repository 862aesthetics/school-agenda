import { format, parse } from 'date-fns';
import type { DateFormat, TimeFormat } from '../types/database';

const DATE_FNS_PATTERNS: Record<DateFormat, string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'Month D, YYYY': 'MMMM d, yyyy',
};

export function formatDate(date: Date, pref: DateFormat = 'MM/DD/YYYY'): string {
  return format(date, DATE_FNS_PATTERNS[pref]);
}

/** Formats a DB "HH:MM:SS" time string according to the 12h/24h preference. */
export function formatTime(time: string, pref: TimeFormat = '12h'): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return pref === '24h' ? format(d, 'HH:mm') : format(d, 'h:mm a');
}

export function formatTimeRange(start: string, end: string, pref: TimeFormat = '12h'): string {
  return `${formatTime(start, pref)} – ${formatTime(end, pref)}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Parses a "HH:MM" <input type="time"> value into "HH:MM:00" for storage. */
export function timeInputToDb(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function dbTimeToInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 5);
}

export function parseDateInput(value: string): Date {
  return parse(value, 'yyyy-MM-dd', new Date());
}
