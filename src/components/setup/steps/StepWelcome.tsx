import { useState } from 'react';
import { Button, Label, Select, Textarea } from '../../ui/primitives';
import { useAppStore } from '../../../store/appStore';
import type { DateFormat, TimeFormat } from '../../../types/database';

export function StepWelcome({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { profile, updateProfile } = useAppStore();
  const [welcomeMessage, setWelcomeMessage] = useState(profile?.welcome_message ?? '');
  const [dateFormat, setDateFormat] = useState<DateFormat>(profile?.date_format ?? 'MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(profile?.time_format ?? '12h');
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    await updateProfile({
      welcome_message: welcomeMessage.trim() || null,
      date_format: dateFormat,
      time_format: timeFormat,
      setup_step: 3,
    });
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Your Welcome Screen</h2>
      <p className="mt-1.5 text-sm text-slate">The first thing you'll see each time you open the app.</p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="msg">Welcome message (optional)</Label>
          <Textarea
            id="msg"
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Focus for today. One task at a time."
          />
        </div>
        <div>
          <Label htmlFor="dateFormat">Date format</Label>
          <Select id="dateFormat" value={dateFormat} onChange={(e) => setDateFormat(e.target.value as DateFormat)}>
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
                type="button"
                onClick={() => setTimeFormat(f)}
                className={`rounded-lg border px-4 py-1.5 text-sm ${
                  timeFormat === f ? 'border-teal bg-teal/10 text-teal' : 'border-slate/25 text-slate'
                }`}
              >
                {f === '12h' ? '12-hour' : '24-hour'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
