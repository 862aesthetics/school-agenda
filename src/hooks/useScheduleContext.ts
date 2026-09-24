import { useSupabaseTable } from './useSupabaseTable';
import type {
  Period,
  DayTemplate,
  DayTemplateBlock,
  BlockTime,
  DateOverride,
  ScheduleTimeOverride,
  RotationAnchor,
  AllPeriodsMeetSchedule,
  AllPeriodsMeetItem,
} from '../types/database';

/** Everything needed to compute "what's the schedule on date X" for a school year. */
export function useScheduleContext(schoolYearId: string | null) {
  const periods = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId, { orderBy: 'order_index' });
  const dayTemplates = useSupabaseTable<DayTemplate>('day_templates', 'school_year_id', schoolYearId);
  const dayTemplateBlocks = useSupabaseTable<DayTemplateBlock>('day_template_blocks', 'school_year_id', schoolYearId);
  const blockTimes = useSupabaseTable<BlockTime>('block_times', 'school_year_id', schoolYearId);
  const dateOverrides = useSupabaseTable<DateOverride>('date_overrides', 'school_year_id', schoolYearId);
  const timeOverrides = useSupabaseTable<ScheduleTimeOverride>('schedule_time_overrides', 'school_year_id', schoolYearId);
  const rotationAnchors = useSupabaseTable<RotationAnchor>('rotation_anchors', 'school_year_id', schoolYearId);
  const apmSchedules = useSupabaseTable<AllPeriodsMeetSchedule>('all_periods_meet_schedules', 'school_year_id', schoolYearId);
  const apmScheduleId = apmSchedules.rows[0]?.id ?? null;
  const apmItems = useSupabaseTable<AllPeriodsMeetItem>('all_periods_meet_items', 'schedule_id', apmScheduleId, {
    orderBy: 'order_index',
    enabled: !!apmScheduleId,
  });

  const loading =
    periods.loading ||
    dayTemplates.loading ||
    dayTemplateBlocks.loading ||
    blockTimes.loading ||
    dateOverrides.loading ||
    timeOverrides.loading ||
    rotationAnchors.loading;

  return {
    loading,
    periods: periods.rows,
    dayTemplates: dayTemplates.rows,
    dayTemplateBlocks: dayTemplateBlocks.rows,
    blockTimes: blockTimes.rows,
    dateOverrides: dateOverrides.rows,
    timeOverrides: timeOverrides.rows,
    anchor: rotationAnchors.rows[0] ?? null,
    apmSchedule: apmSchedules.rows[0] ?? null,
    apmItems: apmItems.rows,
    mutators: {
      dateOverrides,
      timeOverrides,
      dayTemplateBlocks,
      blockTimes,
      rotationAnchors,
      periods,
      apmItems,
      apmSchedules,
    },
  };
}
