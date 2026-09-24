import { useState } from 'react';
import { format } from 'date-fns';
import { Label, Select } from '../ui/primitives';
import { useSupabaseTable } from '../../hooks/useSupabaseTable';
import { useAppStore } from '../../store/appStore';
import { DAY_KEYS, DAY_LABELS, type DayKey, type RotationAnchor } from '../../types/database';

export function RotationAnchorEditor({ schoolYearId }: { schoolYearId: string }) {
  const { profile } = useAppStore();
  const { rows: anchors, insert, update } = useSupabaseTable<RotationAnchor>('rotation_anchors', 'school_year_id', schoolYearId);
  const existing = anchors[0];
  const [date, setDate] = useState(existing?.reference_date ?? format(new Date(), 'yyyy-MM-dd'));
  const [day, setDay] = useState<DayKey>(existing?.reference_day ?? 'day1');

  async function save(nextDate: string, nextDay: DayKey) {
    if (existing) {
      await update(existing.id, { reference_date: nextDate, reference_day: nextDay });
    } else {
      await insert({ user_id: profile!.id, school_year_id: schoolYearId, reference_date: nextDate, reference_day: nextDay });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="refDate">Reference date</Label>
        <input
          id="refDate"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            void save(e.target.value, day);
          }}
          className="w-full rounded-lg border border-slate/30 px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>
      <div>
        <Label htmlFor="refDay">That date was</Label>
        <Select
          id="refDay"
          value={day}
          onChange={(e) => {
            const v = e.target.value as DayKey;
            setDay(v);
            void save(date, v);
          }}
        >
          {DAY_KEYS.map((d) => (
            <option key={d} value={d}>
              {DAY_LABELS[d]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
