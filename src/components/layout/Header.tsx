import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useScheduleStore } from '../../stores/scheduleStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { currentSchedule } = useScheduleStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className="fixed top-0 left-0 z-50 w-full h-20"
      style={{
        background: 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0,73,37,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-on-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">
            Inforario
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`font-semibold transition-colors duration-300 text-sm ${
              isActive('/') 
                ? 'text-primary' 
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Inicio
          </Link>
          <Link
            to="/about"
            className={`font-semibold transition-colors duration-300 text-sm ${
              isActive('/about') 
                ? 'text-primary' 
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Acerca de Inforario
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {currentSchedule && (
            <button
              onClick={() => navigate(`/schedule/${currentSchedule.id || 'current'}`)}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Mi Horario
            </button>
          )}

          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <User size={16} />
              <span className="hidden sm:block">
                {profile?.full_name?.split(' ')[0] || 'Perfil'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary/5 transition-colors"
            >
              Iniciar Sesion
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
