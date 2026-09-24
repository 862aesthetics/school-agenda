// Turns the raw schedule tables (periods, day templates, block times, time
// overrides, All Periods Meet) into a simple ordered list of "segments" for
// a specific date — what the Dashboard, Schedule page, and Calendar week
// view all render.

import type {
  Period,
  BlockTime,
  DayTemplate,
  DayTemplateBlock,
  DateOverride,
  ScheduleTimeOverride,
  AllPeriodsMeetItem,
  BlockKey,
  OverrideType,
} from '../types/database';
import { ALL_BLOCK_ORDER, BLOCK_LABELS } from '../types/database';
import { isoDate, getScheduleDay, type RotationAnchorInput, type ScheduleDayResult, type OverrideMap } from './rotation';
import { parseDateInput } from './format';

export interface ResolvedSegment {
  key: string; // stable react key
  blockKey?: BlockKey; // present for Day 1-4 segments
  label: string; // "Block 2", or an All-Periods-Meet label like "Lunch/Block 3 Lab"
  start: string; // "HH:MM:SS"
  end: string;
  kind: 'period' | 'lunch' | 'free';
  className?: string;
  teacher?: string | null;
  room?: string | null;
  periodId?: string | null;
}

/** Resolve the effective start/end time for a block on a specific date. */
export function resolveBlockTime(
  blockKey: BlockKey,
  date: Date,
  baseTimes: BlockTime[],
  overrides: ScheduleTimeOverride[]
): { start: string; end: string } {
  const dateKey = isoDate(date);

  const singleMatch = overrides.find(
    (o) => o.block_key === blockKey && o.scope === 'single_date' && o.effective_date === dateKey
  );
  if (singleMatch) return { start: singleMatch.start_time, end: singleMatch.end_time };

  const fromDateMatches = overrides
    .filter((o) => o.block_key === blockKey && o.scope === 'from_date' && o.effective_date <= dateKey)
    .sort((a, b) => (a.effective_date < b.effective_date ? 1 : -1));
  if (fromDateMatches.length > 0) {
    return { start: fromDateMatches[0].start_time, end: fromDateMatches[0].end_time };
  }

  const base = baseTimes.find((b) => b.block_key === blockKey);
  return base ? { start: base.start_time, end: base.end_time } : { start: '00:00:00', end: '00:00:00' };
}

/** Build the Day 1-4 schedule (a fixed block order, each pointing at a period or Free). */
export function buildDay1to4Schedule(
  date: Date,
  templateBlocks: DayTemplateBlock[],
  periods: Period[],
  baseTimes: BlockTime[],
  overrides: ScheduleTimeOverride[]
): ResolvedSegment[] {
  return ALL_BLOCK_ORDER.map((blockKey) => {
    const { start, end } = resolveBlockTime(blockKey, date, baseTimes, overrides);
    if (blockKey === 'lunch') {
      return { key: blockKey, blockKey, label: 'Lunch', start, end, kind: 'lunch' as const };
    }
    const mapping = templateBlocks.find((b) => b.block_key === blockKey);
    const period = mapping?.period_id ? periods.find((p) => p.id === mapping.period_id) : undefined;
    if (!period) {
      return {
        key: blockKey,
        blockKey,
        label: BLOCK_LABELS[blockKey],
        start,
        end,
        kind: 'free' as const,
      };
    }
    return {
      key: blockKey,
      blockKey,
      label: BLOCK_LABELS[blockKey],
      start,
      end,
      kind: 'period' as const,
      className: period.class_name,
      teacher: period.teacher,
      room: period.room,
      periodId: period.id,
    };
  });
}

/** Build the All Periods Meet schedule — a completely separate, flat list of items. */
export function buildAllPeriodsMeetSchedule(
  items: AllPeriodsMeetItem[],
  periods: Period[]
): ResolvedSegment[] {
  return [...items]
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => {
      const period = item.period_id ? periods.find((p) => p.id === item.period_id) : undefined;
      return {
        key: item.id,
        label: item.label ?? (item.is_lunch ? 'Lunch' : period?.class_name ?? item.name_override ?? 'Free'),
        start: item.start_time,
        end: item.end_time,
        kind: item.is_lunch ? ('lunch' as const) : ('period' as const),
        className: period?.class_name ?? item.name_override ?? undefined,
        teacher: period?.teacher ?? item.teacher_override,
        room: period?.room ?? item.room_override,
        periodId: period?.id ?? null,
      };
    });
}

function timeOnDate(date: Date, time: string): Date {
  const [h, m, s] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, s ?? 0, 0);
  return d;
}

export interface CurrentStatus {
  state: 'in_class' | 'lunch' | 'free_period' | 'before_school' | 'after_school';
  current?: ResolvedSegment;
  next?: ResolvedSegment;
  minutesRemaining?: number;
}

/** Figure out "what's happening right now" from a resolved segment list. */
export function computeCurrentStatus(now: Date, segments: ResolvedSegment[]): CurrentStatus {
  if (segments.length === 0) return { state: 'after_school' };

  const withTimes = segments.map((s) => ({
    seg: s,
    start: timeOnDate(now, s.start),
    end: timeOnDate(now, s.end),
  }));

  const currentEntry = withTimes.find((e) => now >= e.start && now < e.end);
  if (currentEntry) {
    const idx = withTimes.indexOf(currentEntry);
    const next = withTimes[idx + 1]?.seg;
    const minutesRemaining = Math.max(0, Math.round((currentEntry.end.getTime() - now.getTime()) / 60000));
    const state = currentEntry.seg.kind === 'lunch' ? 'lunch' : currentEntry.seg.kind === 'free' ? 'free_period' : 'in_class';
    return { state, current: currentEntry.seg, next, minutesRemaining };
  }

  if (now < withTimes[0].start) {
    return { state: 'before_school', next: withTimes[0].seg };
  }
  if (now >= withTimes[withTimes.length - 1].end) {
    return { state: 'after_school' };
  }
  // Gap between segments (e.g. overlapping/edited times) — surface the next one.
  const upcoming = withTimes.find((e) => now < e.start);
  return { state: 'free_period', next: upcoming?.seg };
}

export interface ScheduleContextData {
  periods: Period[];
  dayTemplates: DayTemplate[];
  dayTemplateBlocks: DayTemplateBlock[];
  blockTimes: BlockTime[];
  dateOverrides: DateOverride[];
  timeOverrides: ScheduleTimeOverride[];
  anchor: { reference_date: string; reference_day: RotationAnchorInput['referenceDay'] } | null;
  apmItems: AllPeriodsMeetItem[];
}

export function buildOverrideMap(dateOverrides: DateOverride[]): OverrideMap {
  const map: OverrideMap = new Map();
  for (const o of dateOverrides) map.set(o.date, o.override_type as OverrideType);
  return map;
}

/** The single entry point Dashboard/Schedule/Calendar all use: "what does date X look like?" */
export function getDaySchedule(
  date: Date,
  ctx: ScheduleContextData
): { result: ScheduleDayResult; segments: ResolvedSegment[] } {
  const overrides = buildOverrideMap(ctx.dateOverrides);
  const anchorInput: RotationAnchorInput | null = ctx.anchor
    ? { referenceDate: parseDateInput(ctx.anchor.reference_date), referenceDay: ctx.anchor.reference_day }
    : null;
  const result = getScheduleDay(date, anchorInput, overrides);

  if (result.kind === 'day') {
    const template = ctx.dayTemplates.find((t) => t.day_key === result.day);
    const blocks = template ? ctx.dayTemplateBlocks.filter((b) => b.day_template_id === template.id) : [];
    const segments = buildDay1to4Schedule(date, blocks, ctx.periods, ctx.blockTimes, ctx.timeOverrides);
    return { result, segments };
  }
  if (result.kind === 'all_periods_meet') {
    return { result, segments: buildAllPeriodsMeetSchedule(ctx.apmItems, ctx.periods) };
  }
  return { result, segments: [] };
}
