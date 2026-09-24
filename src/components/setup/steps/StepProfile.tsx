import { useState } from 'react';
import { Button, ErrorText, Input, Label, Select } from '../../ui/primitives';
import { AvatarUploader } from '../../AvatarUploader';
import { useAppStore } from '../../../store/appStore';
import type { AvatarShape } from '../../../types/database';

const GRADE_OPTIONS = ['9th', '10th', '11th', '12th'];

export function StepProfile({ onNext }: { onNext: () => void }) {
  const { profile, updateProfile } = useAppStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [schoolName, setSchoolName] = useState(profile?.school_name ?? '');
  const [grade, setGrade] = useState(profile?.grade ?? '12th');
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year?.toString() ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [avatarShape, setAvatarShape] = useState<AvatarShape>(profile?.avatar_shape ?? 'circle');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!displayName.trim() || !schoolName.trim()) {
      setError('Name and school name are required.');
      return;
    }
    setError(null);
    setSaving(true);
    await updateProfile({
      display_name: displayName.trim(),
      school_name: schoolName.trim(),
      grade,
      graduation_year: graduationYear ? Number(graduationYear) : null,
      avatar_url: avatarUrl,
      avatar_shape: avatarShape,
      setup_step: 2,
    });
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Let's set up your profile</h2>
      <p className="mt-1.5 text-sm text-slate">This appears on your Welcome Screen and Dashboard.</p>

      <div className="mt-6 space-y-4">
        <AvatarUploader url={avatarUrl} shape={avatarShape} name={displayName} onUploaded={setAvatarUrl} />

        <div>
          <Label>Photo shape</Label>
          <div className="flex gap-2">
            {(['circle', 'rounded', 'square'] as AvatarShape[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAvatarShape(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  avatarShape === s ? 'border-teal bg-teal/10 text-teal' : 'border-slate/25 text-slate'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jordan" />
        </div>
        <div>
          <Label htmlFor="school">School name</Label>
          <Input id="school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Wayne Hills High School" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g} grade
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="gradYear">Graduation year</Label>
            <Input
              id="gradYear"
              type="number"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="2027"
            />
          </div>
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
