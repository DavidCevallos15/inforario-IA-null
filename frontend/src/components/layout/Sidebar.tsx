import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  CalendarDays,
  LayoutGrid,
  Info,
  User,
  LogIn,
  MessageCircle,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { AppView, Schedule } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentSchedule: Schedule | null;
  sessionUser: any;
  userProfile: any;
}

interface NavItem {
  label: string;
  view: AppView;
  icon: React.ElementType;
  disabled?: boolean;
}

const NavLink: React.FC<{
  item: NavItem;
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      disabled={item.disabled}
      className={`group relative flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-surface-container-high text-primary-fixed'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
      }`}
    >
      <Icon size={20} className={active ? 'text-primary-fixed' : 'text-on-surface-variant group-hover:text-on-surface'} />
      <span className="uppercase text-xs">{item.label}</span>
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-full bg-primary-fixed shadow-glow-primary"
        />
      )}
    </button>
  );
};

const SidebarContent: React.FC<SidebarProps & { onItemClick?: () => void }> = ({
  currentView,
  onNavigate,
  currentSchedule,
  sessionUser,
  userProfile,
  onItemClick,
}) => {
  const navItems: NavItem[] = [
    { label: 'Calendario', view: AppView.LANDING, icon: CalendarDays },
    { label: 'Mi Horario', view: AppView.DASHBOARD, icon: LayoutGrid, disabled: !currentSchedule },
    { label: 'Acerca de', view: AppView.ABOUT, icon: Info },
  ];

  const go = (view: AppView) => {
    onNavigate(view);
    onItemClick?.();
  };

  return (
    <div className="flex h-full flex-col px-5 py-7">
      {/* Brand */}
      <button onClick={() => go(AppView.LANDING)} className="flex items-center gap-3 px-1 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow-primary">
          <GraduationCap size={22} className="text-on-primary" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-primary-fixed">INFORARIO</span>
          <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            Academic Cyber Portal
          </span>
        </span>
      </button>

      {/* Nav */}
      <nav className="mt-10 flex flex-col gap-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.view}
            item={item}
            active={currentView === item.view}
            onClick={() => !item.disabled && go(item.view)}
          />
        ))}
      </nav>

      <div className="flex-grow" />

      {/* Feedback CTA */}
      <a
        href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-on-primary transition-all duration-200 hover:bg-primary-container hover:shadow-glow-primary"
      >
        <MessageCircle size={18} />
        Enviar Feedback
      </a>

      {/* Account / Help */}
      <div className="flex flex-col gap-1 border-t border-outline/40 pt-4">
        {sessionUser ? (
          <button
            onClick={() => go(AppView.PROFILE)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              currentView === AppView.PROFILE
                ? 'text-primary-fixed'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary-fixed">
              <User size={16} />
            </span>
            <span className="truncate">{userProfile?.full_name?.split(' ')[0] || 'Mi Perfil'}</span>
          </button>
        ) : (
          <button
            onClick={() => go(AppView.LOGIN)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high/50 hover:text-on-surface"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary-fixed">
              <LogIn size={16} />
            </span>
            Iniciar Sesión
          </button>
        )}
        <a
          href="https://wa.me/593979107716?text=Hola,%20necesito%20ayuda%20con%20Inforario"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high/50 hover:text-on-surface"
        >
          <span className="flex h-8 w-8 items-center justify-center text-on-surface-variant">
            <HelpCircle size={18} />
          </span>
          Centro de Ayuda
        </a>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-outline/40 bg-surface-container-lowest lg:block">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline/40 bg-surface-container-lowest/90 px-4 backdrop-blur-lg lg:hidden">
        <button onClick={() => props.onNavigate(AppView.LANDING)} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap size={18} className="text-on-primary" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-primary-fixed">INFORARIO</span>
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline/50 text-on-surface"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-outline/40 bg-surface-container-lowest lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-7 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
              <SidebarContent {...props} onItemClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
