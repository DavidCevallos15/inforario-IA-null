import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppView, Schedule } from './types';
import { Sidebar } from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import LandingPage from './features/landing/LandingPage';
import { ScheduleDashboard } from './features/schedule/components/ScheduleDashboard';
import LoginPage from './components/pages/LoginPage';
import ProfilePage from './components/pages/ProfilePage';
import AboutPage from './components/AboutPage';
import { ProcessingView } from './features/uploader/components/ProcessingView';
import { useScheduleUpload } from './features/uploader/hooks/useScheduleUpload';
import {
  supabase,
  getUserSchedules,
  deleteSchedule,
  getUserProfile,
  getScheduleById,
} from './services/supabase/supabaseClient';
import './globals.css';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [showUploaderInDashboard, setShowUploaderInDashboard] = useState(false);

  const fetchSchedules = async (uid: string) => {
    try {
      const data = await getUserSchedules(uid);
      setSavedSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  useEffect(() => {
    const initDevice = () => {
      let id = localStorage.getItem('inforario_device_id');
      if (!id) {
        id = 'dev-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('inforario_device_id', id);
      }
      return id;
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setSessionUser(user);
      if (user) {
        setDeviceId(user.id);
        getUserProfile(user.id).then(setUserProfile);
      } else {
        setDeviceId(initDevice());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSessionUser(user);
      if (user) {
        setDeviceId(user.id);
        getUserProfile(user.id).then(setUserProfile);
      } else {
        setDeviceId(initDevice());
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (deviceId) fetchSchedules(deviceId);
  }, [deviceId]);

  useEffect(() => {
    if (sessionUser && view === AppView.LOGIN) setView(AppView.LANDING);
  }, [sessionUser, view]);

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
      } catch (e: any) {
        console.error('Error removing schedule', e);
        alert(e.message || 'No se pudo eliminar el horario. Por favor intente de nuevo.');
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`¿Estás seguro de eliminar ${ids.length} horarios seleccionados?`)) {
      try {
        await Promise.all(ids.map((id) => deleteSchedule(id)));
        if (deviceId) fetchSchedules(deviceId);
      } catch (e) {
        console.error(e);
        alert('Ocurrió un error al eliminar los horarios.');
      }
    }
  };

  // Login is a full-screen, sidebar-less experience.
  if (view === AppView.LOGIN) {
    return (
      <>
        <LoginPage onLogin={() => setView(AppView.LANDING)} onBack={() => setView(AppView.LANDING)} />
        <AnimatePresence>{isProcessing && <ProcessingView />}</AnimatePresence>
      </>
    );
  }

  return (
    <div className="cyber-bg relative min-h-screen w-full">
      <Sidebar currentView={view} onNavigate={setView} currentSchedule={currentSchedule} sessionUser={sessionUser} userProfile={userProfile} />
      <div className="flex min-h-screen flex-col pt-16 lg:pt-0 lg:pl-72">
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-6 md:px-8 md:py-8">
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
              onSignOut={() => supabase.auth.signOut()}
              onNavigate={setView}
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
        </main>
        <Footer />
      </div>
      <AnimatePresence>{isProcessing && <ProcessingView />}</AnimatePresence>
    </div>
  );
};

export default App;
