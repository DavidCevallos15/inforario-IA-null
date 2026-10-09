import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { AppView, Schedule, ScheduleSummary, UserProfile } from './types';
import { Navbar } from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './features/landing/LandingPage';
import { ProcessingView } from './features/uploader/components/ProcessingView';
import { useScheduleUpload } from './features/uploader/hooks/useScheduleUpload';
import { loadGuestSchedule, useGuestScheduleSync } from './hooks/useGuestScheduleSync';
import {
  supabase,
  getUserSchedules,
  deleteSchedule,
  deleteSchedules,
  getUserProfile,
  getScheduleById,
} from './services/supabase/supabaseClient';
import './globals.css';

// Vistas secundarias en chunks propios: la landing carga sin esperar jsPDF, el grid, etc.
const ScheduleDashboard = lazy(() =>
  import('./features/schedule/components/ScheduleDashboard').then((m) => ({ default: m.ScheduleDashboard }))
);
const LoginPage = lazy(() => import('./components/pages/LoginPage'));
const ProfilePage = lazy(() => import('./components/pages/ProfilePage'));
const AboutPage = lazy(() => import('./components/AboutPage'));

// Mientras carga una vista: renglones a lápiz con la forma de un título y su texto
const ViewFallback = () => (
  <div className="space-y-4 py-12" role="status" aria-label="Cargando">
    <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-pencil/20" />
    <div className="h-4 w-full max-w-xl animate-pulse rounded bg-pencil/15" />
    <div className="h-4 w-5/6 max-w-lg animate-pulse rounded bg-pencil/15" />
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  // Si un invitado ya había cargado un horario en este navegador, se recupera
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(() => loadGuestSchedule());
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [savedSchedules, setSavedSchedules] = useState<ScheduleSummary[]>([]);
  const [showUploaderInDashboard, setShowUploaderInDashboard] = useState(false);

  const fetchSchedules = useCallback(async (uid: string) => {
    setSavedSchedules(await getUserSchedules(uid));
  }, []);

  useEffect(() => {
    const getGuestDeviceId = () => {
      try {
        let id = localStorage.getItem('inforario_device_id');
        if (!id) {
          id = `dev-${crypto.randomUUID()}`;
          localStorage.setItem('inforario_device_id', id);
        }
        return id;
      } catch {
        // localStorage bloqueado (modo privado estricto): id efímero
        return `dev-${crypto.randomUUID()}`;
      }
    };

    // onAuthStateChange emite INITIAL_SESSION al suscribirse, así que no hace
    // falta llamar además a getSession() (evita cargar el perfil dos veces).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (event === 'SIGNED_OUT') {
        // No dejar visible el horario del usuario anterior (equipos compartidos)
        setCurrentSchedule(null);
        setSavedSchedules([]);
        setView(AppView.LANDING);
      }
      setSessionUser(user);
      if (user) {
        setDeviceId(user.id);
        getUserProfile(user.id).then(setUserProfile);
      } else {
        setDeviceId(getGuestDeviceId());
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (deviceId) fetchSchedules(deviceId);
  }, [deviceId, fetchSchedules]);

  useEffect(() => {
    if (sessionUser && view === AppView.LOGIN) setView(AppView.LANDING);
  }, [sessionUser, view]);

  useGuestScheduleSync({ sessionUser, currentSchedule, setCurrentSchedule, onMigrated: fetchSchedules });

  // Cada vista empieza arriba de la hoja
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const { isProcessing, uploadFile } = useScheduleUpload({
    deviceId,
    onSuccess: (newSchedule) => {
      setCurrentSchedule(newSchedule);
      setView(AppView.DASHBOARD);
      setShowUploaderInDashboard(false);
      if (deviceId) fetchSchedules(deviceId);
    },
  });

  const handleOpenSchedule = async (id: string) => {
    try {
      const full = await getScheduleById(id);
      if (full?.schedule_data) {
        setCurrentSchedule({
          id: full.id,
          title: full.title,
          academic_period: full.academic_period,
          faculty: full.faculty,
          sessions: full.schedule_data,
          lastUpdated: new Date(),
        });
        setView(AppView.DASHBOARD);
      }
    } catch (e) {
      console.error(e);
      alert('Error al abrir el horario.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este horario?')) {
      try {
        await deleteSchedule(id);
        setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
        if (currentSchedule?.id === id) {
          setCurrentSchedule(null);
          setView(AppView.LANDING);
        }
      } catch (e) {
        console.error('Error removing schedule', e);
        alert(e instanceof Error ? e.message : 'No se pudo eliminar el horario. Por favor intente de nuevo.');
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`¿Estás seguro de eliminar ${ids.length} horarios seleccionados?`)) {
      try {
        await deleteSchedules(ids);
        setSavedSchedules((prev) => prev.filter((s) => !ids.includes(s.id)));
        if (currentSchedule?.id && ids.includes(currentSchedule.id)) {
          setCurrentSchedule(null);
          setView(AppView.LANDING);
        }
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : 'Ocurrió un error al eliminar los horarios.');
      }
    }
  };

  return (
    // El escritorio y, encima, una sola hoja de cuaderno que contiene toda la app
    <div className="min-h-dvh w-full bg-surface-container-high md:px-6 md:py-6">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-bold text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <div className="paper-grid-soft margin-rule relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-x-clip shadow-sheet [--margin-x:14px] md:min-h-[calc(100dvh-3rem)] md:rounded md:[--margin-x:44px]">
        <Navbar currentView={view} onNavigate={setView} currentSchedule={currentSchedule} sessionUser={sessionUser} userProfile={userProfile} />
        <main id="contenido" className="w-full flex-grow pl-8 pr-5 md:pl-20 md:pr-12">
          <Suspense fallback={<ViewFallback />}>
            {view === AppView.LOGIN && <LoginPage onLogin={() => setView(AppView.LANDING)} onBack={() => setView(AppView.LANDING)} />}
            {view === AppView.PROFILE && <ProfilePage onBack={() => setView(AppView.LANDING)} onLogout={() => setView(AppView.LANDING)} />}
            {view === AppView.ABOUT && <AboutPage />}
            {view === AppView.LANDING && (
              <LandingPage
                sessionUser={sessionUser}
                userProfile={userProfile}
                savedSchedules={savedSchedules}
                isProcessing={isProcessing}
                showUploaderInDashboard={showUploaderInDashboard}
                setShowUploaderInDashboard={setShowUploaderInDashboard}
                onUpload={uploadFile}
                onOpenSchedule={handleOpenSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onBulkDelete={handleBulkDelete}
              />
            )}
            {view === AppView.DASHBOARD && currentSchedule && (
              <ScheduleDashboard
                currentSchedule={currentSchedule}
                setCurrentSchedule={setCurrentSchedule}
                onReset={() => {
                  setCurrentSchedule(null);
                  setView(AppView.LANDING);
                  setShowUploaderInDashboard(false);
                }}
                sessionUser={sessionUser}
                userProfile={userProfile}
                deviceId={deviceId}
                fetchSchedules={fetchSchedules}
              />
            )}
          </Suspense>
        </main>
        <Footer onNavigate={setView} showCredit={!(view === AppView.ABOUT || (view === AppView.LANDING && !sessionUser))} />
      </div>
      <AnimatePresence>{isProcessing && <ProcessingView />}</AnimatePresence>
    </div>
  );
};

export default App;
