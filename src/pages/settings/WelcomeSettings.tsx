import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Label, Select, Textarea } from '../../components/ui/primitives';
import type { DateFormat, TimeFormat } from '../../types/database';

export function WelcomeSettings() {
  const { profile, updateProfile } = useAppStore();
  const [welcomeMessage, setWelcomeMessage] = useState(profile?.welcome_message ?? '');

  if (!profile) return null;

  return (
    <div className="max-w-md space-y-4">
      <div>
        <Label htmlFor="msg">Welcome message</Label>
        <Textarea
          id="msg"
          rows={2}
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          onBlur={() => updateProfile({ welcome_message: welcomeMessage.trim() || null })}
        />
      </div>
      <div>
        <Label htmlFor="dateFormat">Date format</Label>
        <Select
          id="dateFormat"
          value={profile.date_format}
          onChange={(e) => updateProfile({ date_format: e.target.value as DateFormat })}
        >
          <option value="MM/DD/YYYY">09/14/2026</option>
          <option value="DD/MM/YYYY">14/09/2026</option>
          <option value="YYYY-MM-DD">2026-09-14</option>
          <option value="Month D, YYYY">September 14, 2026</option>
        </Select>
      </div>
      <div>
        <Label>Time format</Label>
        <div className="flex gap-2">
          {(['12h', '24h'] as TimeFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => updateProfile({ time_format: f })}
              className={`rounded-lg border px-4 py-1.5 text-sm ${
                profile.time_format === f ? 'border-teal bg-teal/10 text-teal' : 'border-slate/25 text-slate'
              }`}
            >
              {f === '12h' ? '12-hour' : '24-hour'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
