import React from 'react';
import { Sparkles, User, MessageCircle } from 'lucide-react';
import type { User as AuthUser } from '@supabase/supabase-js';
import { AppView, Schedule, UserProfile } from '../../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentSchedule: Schedule | null;
  sessionUser: AuthUser | null;
  userProfile: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentSchedule,
  sessionUser,
  userProfile,
}) => {
  return (
    <nav
      className="fixed top-0 left-0 z-50 w-full h-20"
      style={{
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,73,37,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(AppView.LANDING)}
        >
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-on-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">
            Inforario
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <span
            onClick={() => onNavigate(AppView.LANDING)}
            className={`font-semibold transition-colors duration-300 cursor-pointer text-sm ${
              currentView === AppView.LANDING
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Inicio
          </span>
          <span
            onClick={() => onNavigate(AppView.ABOUT)}
            className={`font-semibold transition-colors duration-300 cursor-pointer text-sm ${
              currentView === AppView.ABOUT
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Acerca de Inforario
          </span>
        </div>

        {/* Auth / Action Button */}
        <div className="flex items-center gap-3">
          {currentSchedule && (
            <button
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className={`hidden sm:flex items-center gap-2 text-sm font-semibold transition-colors ${
                currentView === AppView.DASHBOARD
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Mi Horario
            </button>
          )}

          {sessionUser ? (
            <button
              onClick={() => onNavigate(AppView.PROFILE)}
              className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <User size={16} />
              <span className="hidden sm:block">
                {userProfile?.full_name?.split(" ")[0] || "Perfil"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate(AppView.LOGIN)}
              className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary/5 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}

          <a
            href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-full font-semibold text-sm hover:bg-primary-container transition-colors duration-200"
          >
            <MessageCircle size={14} className="hidden sm:block" />
            <span className="hidden sm:block">Feedback</span>
            <span className="sm:hidden">FB</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
