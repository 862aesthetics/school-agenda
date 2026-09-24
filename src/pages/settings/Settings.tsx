import { useState } from 'react';
import clsx from 'clsx';
import { ProfileSettings } from './ProfileSettings';
import { WelcomeSettings } from './WelcomeSettings';
import { ScheduleSettings } from './ScheduleSettings';
import { SchoolYearsSettings } from './SchoolYearsSettings';
import { AccountSecurity } from './AccountSecurity';
import { AppearanceSettings } from './AppearanceSettings';
import { StandardizedNotice } from './StandardizedNotice';

type Category = 'profile' | 'welcome' | 'schedule' | 'assignments' | 'calendar' | 'grades' | 'notes' | 'appearance' | 'schoolYears' | 'account';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'welcome', label: 'Welcome Screen' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'grades', label: 'Grades' },
  { key: 'notes', label: 'Notes' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'schoolYears', label: 'School Years' },
  { key: 'account', label: 'Account & Security' },
];

export default function SettingsPage() {
  const [active, setActive] = useState<Category>('profile');

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl text-ink">Settings</h1>

      <div className="flex flex-col gap-6 sm:flex-row">
        <nav className="flex gap-1.5 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:overflow-visible">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={clsx(
                'shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-left text-sm font-medium transition-colors',
                active === c.key ? 'bg-teal/10 text-teal' : 'text-slate hover:bg-slate/10'
              )}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {active === 'profile' && <ProfileSettings />}
          {active === 'welcome' && <WelcomeSettings />}
          {active === 'schedule' && <ScheduleSettings />}
          {active === 'assignments' && <StandardizedNotice text="Assignments work the same way for everyone — nothing to configure here." />}
          {active === 'calendar' && <StandardizedNotice text="Calendar behavior is standardized — nothing to configure here." />}
          {active === 'grades' && <StandardizedNotice text="Grades tracking is standardized — nothing to configure here." />}
          {active === 'notes' && <StandardizedNotice text="Notes behavior is standardized — nothing to configure here." />}
          {active === 'appearance' && <AppearanceSettings />}
          {active === 'schoolYears' && <SchoolYearsSettings />}
          {active === 'account' && <AccountSecurity />}
        </div>
      </div>
    </div>
  );
}
