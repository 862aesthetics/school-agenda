import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { AvatarUploader } from '../../components/AvatarUploader';
import { Input, Label, Select } from '../../components/ui/primitives';
import type { AvatarShape } from '../../types/database';

const GRADE_OPTIONS = ['9th', '10th', '11th', '12th'];

export function ProfileSettings() {
  const { profile, updateProfile } = useAppStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [schoolName, setSchoolName] = useState(profile?.school_name ?? '');
  const [grade, setGrade] = useState(profile?.grade ?? '12th');
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year?.toString() ?? '');

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setSchoolName(profile?.school_name ?? '');
    setGrade(profile?.grade ?? '12th');
    setGraduationYear(profile?.graduation_year?.toString() ?? '');
  }, [profile?.id]);

  if (!profile) return null;

  return (
    <div className="max-w-md space-y-4">
      <AvatarUploader
        url={profile.avatar_url}
        shape={profile.avatar_shape}
        name={profile.display_name}
        onUploaded={(url) => updateProfile({ avatar_url: url })}
      />

      <div>
        <Label>Photo shape</Label>
        <div className="flex gap-2">
          {(['circle', 'rounded', 'square'] as AvatarShape[]).map((s) => (
            <button
              key={s}
              onClick={() => updateProfile({ avatar_shape: s })}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                profile.avatar_shape === s ? 'border-teal bg-teal/10 text-teal' : 'border-slate/25 text-slate'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => updateProfile({ display_name: displayName.trim() })}
        />
      </div>
      <div>
        <Label htmlFor="school">School name</Label>
        <Input
          id="school"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          onBlur={() => updateProfile({ school_name: schoolName.trim() })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select
            id="grade"
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              updateProfile({ grade: e.target.value });
            }}
          >
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
            onBlur={() => updateProfile({ graduation_year: graduationYear ? Number(graduationYear) : null })}
          />
        </div>
      </div>
    </div>
  );
}
