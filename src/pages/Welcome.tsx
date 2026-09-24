import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Avatar } from '../components/ui/primitives';
import { formatDate, formatTime, greetingForHour } from '../utils/format';

export default function Welcome() {
  const navigate = useNavigate();
  const { profile } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('welcomeSeen', '1');
  }, []);

  function enter() {
    setEntering(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 280);
  }

  const timeString = formatTime(
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`,
    profile?.time_format ?? '12h'
  );

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center bg-navy px-6 text-white transition-opacity duration-300 ${
        entering ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar url={profile?.avatar_url} name={profile?.display_name} shape={profile?.avatar_shape} size={72} />

        <p className="mt-8 text-sm tracking-wide text-white/50">{formatDate(now, profile?.date_format)}</p>
        <p className="mt-1 font-display text-5xl tabular-nums text-white sm:text-6xl">{timeString}</p>

        <h1 className="mt-8 font-display text-2xl text-white sm:text-[28px]">
          {greetingForHour(now.getHours())}, {profile?.display_name ?? 'there'}.
        </h1>

        {(profile?.school_name || profile?.grade) && (
          <p className="mt-2 text-sm text-white/60">
            {[profile?.school_name, profile?.grade ? `${profile.grade} grade` : null].filter(Boolean).join(' · ')}
          </p>
        )}

        {profile?.welcome_message && <p className="mt-5 max-w-xs text-sm text-white/70">{profile.welcome_message}</p>}
      </div>

      <button
        onClick={enter}
        className="mt-14 rounded-full bg-white px-10 py-3 text-sm font-semibold tracking-wide text-navy transition-transform hover:scale-[1.03] active:scale-95"
      >
        ENTER
      </button>
    </div>
  );
}
