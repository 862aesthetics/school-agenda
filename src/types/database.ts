// Types mirroring supabase/migrations/0001_init.sql. Kept hand-written and
// close to the schema rather than codegen'd, so they stay easy to read.

export type AvatarShape = 'circle' | 'rounded' | 'square';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'Month D, YYYY';
export type TimeFormat = '12h' | '24h';
export type DayKey = 'day1' | 'day2' | 'day3' | 'day4';
export type BlockKey = 'block1' | 'block2' | 'block3' | 'lunch' | 'block4' | 'block5' | 'block6';
export type ScheduleBlockKey = Exclude<BlockKey, 'lunch'>;
export type OverrideType = DayKey | 'all_periods_meet' | 'no_school';
export type Priority = 'low' | 'normal' | 'high';
export type MarkingPeriod = 'MP1' | 'MP2' | 'MP3' | 'MP4';
export type NoteType = 'class' | 'general';
export type TimeScope = 'single_date' | 'from_date';

export interface Profile {
  id: string;
  display_name: string | null;
  school_name: string | null;
  grade: string | null;
  graduation_year: number | null;
  avatar_url: string | null;
  avatar_shape: AvatarShape;
  welcome_message: string | null;
  date_format: DateFormat;
  time_format: TimeFormat;
  active_school_year_id: string | null;
  setup_completed: boolean;
  setup_step: number;
  created_at: string;
  updated_at: string;
}

export interface SchoolYear {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  archived: boolean;
  created_at: string;
}

export interface Period {
  id: string;
  user_id: string;
  school_year_id: string;
  order_index: number;
  class_name: string;
  teacher: string | null;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockTime {
  id: string;
  user_id: string;
  school_year_id: string;
  block_key: BlockKey;
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface DayTemplate {
  id: string;
  user_id: string;
  school_year_id: string;
  day_key: DayKey;
}

export interface DayTemplateBlock {
  id: string;
  user_id: string;
  school_year_id: string;
  day_template_id: string;
  block_key: ScheduleBlockKey;
  period_id: string | null;
}

export interface AllPeriodsMeetSchedule {
  id: string;
  user_id: string;
  school_year_id: string;
}

export interface AllPeriodsMeetItem {
  id: string;
  user_id: string;
  schedule_id: string;
  order_index: number;
  period_id: string | null;
  label: string | null;
  name_override: string | null;
  teacher_override: string | null;
  room_override: string | null;
  start_time: string;
  end_time: string;
  is_lunch: boolean;
}

export interface RotationAnchor {
  id: string;
  user_id: string;
  school_year_id: string;
  reference_date: string; // "YYYY-MM-DD"
  reference_day: DayKey;
}

export interface DateOverride {
  id: string;
  user_id: string;
  school_year_id: string;
  date: string;
  override_type: OverrideType;
}

export interface ScheduleTimeOverride {
  id: string;
  user_id: string;
  school_year_id: string;
  block_key: BlockKey;
  scope: TimeScope;
  effective_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  school_year_id: string;
  period_id: string;
  name: string;
  due_date: string;
  due_time: string | null;
  description: string | null;
  priority: Priority;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  school_year_id: string;
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  user_id: string;
  school_year_id: string;
  period_id: string;
  marking_period: MarkingPeriod;
  grade_value: string | null;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  school_year_id: string;
  type: NoteType;
  period_id: string | null;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const BLOCK_LABELS: Record<BlockKey, string> = {
  block1: 'Block 1',
  block2: 'Block 2',
  block3: 'Block 3',
  lunch: 'Lunch',
  block4: 'Block 4',
  block5: 'Block 5',
  block6: 'Block 6',
};

export const SCHEDULE_BLOCK_ORDER: ScheduleBlockKey[] = [
  'block1', 'block2', 'block3', 'block4', 'block5', 'block6',
];

export const ALL_BLOCK_ORDER: BlockKey[] = [
  'block1', 'block2', 'block3', 'lunch', 'block4', 'block5', 'block6',
];

export const DAY_KEYS: DayKey[] = ['day1', 'day2', 'day3', 'day4'];

export const DAY_LABELS: Record<DayKey, string> = {
  day1: 'Day 1',
  day2: 'Day 2',
  day3: 'Day 3',
  day4: 'Day 4',
};

export const DEFAULT_BLOCK_TIMES: Record<BlockKey, { start: string; end: string }> = {
  block1: { start: '07:20', end: '08:18' },
  block2: { start: '08:22', end: '09:20' },
  block3: { start: '09:24', end: '10:22' },
  lunch: { start: '10:22', end: '11:17' },
  block4: { start: '11:17', end: '12:15' },
  block5: { start: '12:19', end: '13:17' },
  block6: { start: '13:21', end: '14:19' },
};
