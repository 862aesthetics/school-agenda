// The rotation engine.
//
// Rules (from the product spec, do not violate):
//  - Rotation order is Day 4 -> Day 3 -> Day 2 -> Day 1 -> Day 4 -> repeat.
//  - Weekends do not advance the rotation.
//  - A "No School" date does not advance the rotation.
//  - A single-date override (forcing a specific Day 1-4, or All Periods Meet)
//    changes what is *displayed* for that date only. It does NOT change the
//    natural rotation sequence for dates after it — the day that "should"
//    have occurred there is still the one future dates count from.
//
// So there are two ideas kept deliberately separate:
//  - the NATURAL day (what the untouched rotation says a date is)
//  - the DISPLAY result (what the user actually sees for that date, after
//    weekends / No School / a specific override are applied)

import { addDays, differenceInCalendarDays, format } from 'date-fns';
import type { DayKey, OverrideType } from '../types/database';

export type ScheduleDayResult =
  | { kind: 'day'; day: DayKey }
  | { kind: 'all_periods_meet' }
  | { kind: 'no_school' }
  | { kind: 'weekend' };

export interface RotationAnchorInput {
  referenceDate: Date;
  referenceDay: DayKey;
}

/** Map of "YYYY-MM-DD" -> override type, for a single school year. */
export type OverrideMap = Map<string, OverrideType>;

export function isoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function nextDay(d: DayKey): DayKey {
  const order: DayKey[] = ['day4', 'day3', 'day2', 'day1'];
  return order[(order.indexOf(d) + 1) % order.length];
}

function prevDay(d: DayKey): DayKey {
  const order: DayKey[] = ['day4', 'day3', 'day2', 'day1'];
  return order[(order.indexOf(d) - 1 + order.length) % order.length];
}

/** A date counts toward advancing the rotation unless it's a weekend or explicitly "No School". */
export function isRotationSchoolDay(date: Date, overrides: OverrideMap): boolean {
  if (isWeekend(date)) return false;
  if (overrides.get(isoDate(date)) === 'no_school') return false;
  return true;
}

/** The day the rotation would naturally land on, ignoring any single-date display override. */
export function computeNaturalDay(
  target: Date,
  anchor: RotationAnchorInput,
  overrides: OverrideMap
): DayKey {
  const diff = differenceInCalendarDays(target, anchor.referenceDate);
  if (diff === 0) return anchor.referenceDay;

  let running = anchor.referenceDay;
  if (diff > 0) {
    for (let i = 1; i <= diff; i++) {
      const d = addDays(anchor.referenceDate, i);
      if (isRotationSchoolDay(d, overrides)) running = nextDay(running);
    }
  } else {
    for (let i = -1; i >= diff; i--) {
      const d = addDays(anchor.referenceDate, i);
      if (isRotationSchoolDay(d, overrides)) running = prevDay(running);
    }
  }
  return running;
}

/** What should actually be shown/used for a given date. */
export function getScheduleDay(
  target: Date,
  anchor: RotationAnchorInput | null,
  overrides: OverrideMap
): ScheduleDayResult {
  const key = isoDate(target);
  const override = overrides.get(key);

  if (override === 'no_school') return { kind: 'no_school' };
  if (override === 'all_periods_meet') return { kind: 'all_periods_meet' };
  if (override === 'day1' || override === 'day2' || override === 'day3' || override === 'day4') {
    return { kind: 'day', day: override };
  }
  if (isWeekend(target)) return { kind: 'weekend' };
  if (!anchor) return { kind: 'no_school' }; // no rotation configured yet

  return { kind: 'day', day: computeNaturalDay(target, anchor, overrides) };
}
