import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  CalendarClock,
  ListChecks,
  CalendarDays,
  GraduationCap,
  NotebookPen,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { TopStatusBar } from './TopStatusBar';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/assignments', label: 'Assignments', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/grades', label: 'Grades', icon: GraduationCap },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
];

const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4);

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center border-r border-slate/10 bg-navy py-5 md:flex">
        <div className="mb-6 h-8 w-8 rounded-lg bg-teal" aria-hidden />
        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <SidebarLink to="/settings" label="Settings" icon={SettingsIcon} />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="h-7 w-7 rounded-md bg-navy" aria-hidden />
        <TopStatusBar compact />
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-ink hover:bg-slate/10"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile slide-over menu (Settings + overflow) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white p-5 shadow-panel">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="p-1.5 text-slate">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {[...NAV_ITEMS, { to: '/settings', label: 'Settings', icon: SettingsIcon }].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px]',
                      isActive ? 'bg-teal/10 text-teal font-medium' : 'text-ink hover:bg-slate/10'
                    )
                  }
                >
                  <item.icon size={19} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop top status bar */}
      <div className="fixed inset-x-0 top-0 z-20 hidden h-14 items-center justify-end border-b border-slate/10 bg-white/95 px-6 backdrop-blur md:flex md:pl-[76px]">
        <TopStatusBar />
      </div>

      {/* Main content */}
      <main className="pb-20 pt-16 md:ml-[76px] md:pb-6 md:pt-14">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate/10 bg-white/95 backdrop-blur md:hidden">
        {MOBILE_PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
                isActive ? 'text-teal' : 'text-slate'
              )
            }
          >
            <item.icon size={21} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutGrid }) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        clsx(
          'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
          isActive ? 'bg-teal text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <Icon size={20} />
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-navy px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-panel transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </NavLink>
  );
}
