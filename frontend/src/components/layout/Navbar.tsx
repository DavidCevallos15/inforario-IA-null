import React from 'react';
import { CircleUserRound, LogIn } from 'lucide-react';
import type { User as AuthUser } from '@supabase/supabase-js';
import { AppView, Schedule, UserProfile } from '../../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentSchedule: Schedule | null;
  sessionUser: AuthUser | null;
  userProfile: UserProfile | null;
}

/** Encabezado de la hoja: el nombre escrito en tinta y la navegación en una sola línea. */
export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, currentSchedule, sessionUser, userProfile }) => {
  const link = (view: AppView) =>
    `relative rounded px-2 py-1.5 text-sm font-bold transition-colors duration-150 ${
      currentView === view ? 'text-on-surface' : 'text-on-surface-variant hover:text-primary'
    }`;

  // La vista actual se marca como en el cuaderno: subrayada con resaltador
  const current = (view: AppView) =>
    currentView === view ? (
      <span aria-hidden className="absolute inset-x-1 -bottom-0.5 h-1 rounded-full bg-hl-yellow" />
    ) : null;

  const firstName = userProfile?.full_name?.split(' ')[0];

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm">
      <nav
        aria-label="Principal"
        className="flex h-16 items-center justify-between gap-3 pl-8 pr-4 md:pl-20 md:pr-12"
      >
        <button
          type="button"
          onClick={() => onNavigate(AppView.LANDING)}
          className="ink -ml-1 rounded px-1 text-[1.75rem] font-bold leading-none"
          aria-label="Inforario, ir al inicio"
        >
          Inforario
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {currentSchedule && (
            <button
              type="button"
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className={link(AppView.DASHBOARD)}
              aria-current={currentView === AppView.DASHBOARD ? 'page' : undefined}
            >
              {current(AppView.DASHBOARD)}
              Mi horario
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate(AppView.ABOUT)}
            className={`${link(AppView.ABOUT)} hidden sm:inline-flex`}
            aria-current={currentView === AppView.ABOUT ? 'page' : undefined}
          >
            {current(AppView.ABOUT)}
            Cómo funciona
          </button>

          {sessionUser ? (
            <button
              type="button"
              onClick={() => onNavigate(AppView.PROFILE)}
              className="ml-1 inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-bold text-on-surface transition-colors duration-150 hover:border-primary hover:text-primary"
              aria-current={currentView === AppView.PROFILE ? 'page' : undefined}
            >
              <CircleUserRound size={18} strokeWidth={2} />
              <span className="hidden max-w-[10ch] truncate sm:inline">{firstName || 'Perfil'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(AppView.LOGIN)}
              className="ml-1 inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-bold text-primary transition-colors duration-150 hover:bg-primary hover:text-on-primary"
            >
              <LogIn size={16} strokeWidth={2.25} />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
