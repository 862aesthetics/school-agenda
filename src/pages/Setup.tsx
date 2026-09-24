import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { SetupProgress } from '../components/setup/SetupProgress';
import { StepProfile } from '../components/setup/steps/StepProfile';
import { StepWelcome } from '../components/setup/steps/StepWelcome';
import { StepPeriods } from '../components/setup/steps/StepPeriods';
import { StepDayTemplates } from '../components/setup/steps/StepDayTemplates';
import { StepAllPeriodsMeet } from '../components/setup/steps/StepAllPeriodsMeet';
import { StepRotation } from '../components/setup/steps/StepRotation';
import { StepConfirm } from '../components/setup/steps/StepConfirm';

function defaultSchoolYearName(): string {
  const now = new Date();
  const year = now.getFullYear();
  // A new school year typically starts around July/August.
  return now.getMonth() >= 6 ? `${year}–${year + 1}` : `${year - 1}–${year}`;
}

export default function Setup() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { profile, loadForUser, activeSchoolYear, setActiveSchoolYear } = useAppStore();
  const [step, setStep] = useState(profile?.setup_step ?? 1);
  const [ensuring, setEnsuring] = useState(true);
  const ensured = useRef(false);

  useEffect(() => {
    if (profile) setStep(profile.setup_step);
  }, [profile?.setup_step]);

  useEffect(() => {
    if (ensured.current || !user || !profile) return;
    ensured.current = true;
    (async () => {
      if (!profile.active_school_year_id) {
        const { data: year } = await supabase
          .from('school_years')
          .insert({ user_id: user.id, name: defaultSchoolYearName(), is_active: true })
          .select()
          .single();
        if (year) {
          await supabase.from('profiles').update({ active_school_year_id: year.id }).eq('id', user.id);
          setActiveSchoolYear(year);
          await loadForUser(user.id);
        }
      }
      setEnsuring(false);
    })();
  }, [user, profile, loadForUser, setActiveSchoolYear]);

  if (ensuring || !activeSchoolYear) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate">Setting things up…</div>
    );
  }

  const schoolYearId = activeSchoolYear.id;

  return (
    <div className="min-h-dvh bg-white px-5 py-10">
      <div className="mx-auto max-w-lg">
        <SetupProgress step={step} />
        {step === 1 && <StepProfile onNext={() => setStep(2)} />}
        {step === 2 && <StepWelcome onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepPeriods schoolYearId={schoolYearId} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepDayTemplates schoolYearId={schoolYearId} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <StepAllPeriodsMeet schoolYearId={schoolYearId} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {step === 6 && <StepRotation schoolYearId={schoolYearId} onNext={() => setStep(7)} onBack={() => setStep(5)} />}
        {step === 7 && (
          <StepConfirm schoolYearId={schoolYearId} onConfirm={() => navigate('/welcome', { replace: true })} onBack={() => setStep(6)} />
        )}
      </div>
    </div>
  );
}
