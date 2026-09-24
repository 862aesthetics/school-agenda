import type { ReactNode } from 'react';
import { useAppStore } from '../../store/appStore';
import { PeriodsManager } from '../../components/schedule/PeriodsManager';
import { DayTemplateBuilder } from '../../components/schedule/DayTemplateBuilder';
import { AllPeriodsMeetManager } from '../../components/schedule/AllPeriodsMeetManager';
import { RotationAnchorEditor } from '../../components/schedule/RotationAnchorEditor';

export function ScheduleSettings() {
  const { activeSchoolYear } = useAppStore();
  if (!activeSchoolYear) return null;
  const schoolYearId = activeSchoolYear.id;

  return (
    <div className="space-y-8">
      <SettingsSection title="Classes" description="Each period is a permanent class for the whole year.">
        <PeriodsManager schoolYearId={schoolYearId} />
      </SettingsSection>

      <SettingsSection title="Day 1–4 rotation" description="Block times and which period fills each block, per day.">
        <DayTemplateBuilder schoolYearId={schoolYearId} />
      </SettingsSection>

      <SettingsSection title="All Periods Meet" description="A separate special-day schedule, apart from the rotation.">
        <AllPeriodsMeetManager schoolYearId={schoolYearId} />
      </SettingsSection>

      <SettingsSection title="Rotation reference" description="The anchor date everything else is calculated from.">
        <RotationAnchorEditor schoolYearId={schoolYearId} />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mb-3 text-xs text-slate">{description}</p>
      {children}
    </section>
  );
}
