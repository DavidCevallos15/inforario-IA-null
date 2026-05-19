import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { LayoutDashboard, FileText, PenTool } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useUIStore } from '../../stores/uiStore';
import Uploader from '../Uploader';
import ScheduleList from '../layout/ScheduleList';
import { parseScheduleFile } from '../../services/scheduleParser';
import { parseScheduleFileWithEdge } from '../../services/scheduleExtractorEdge';
import type { Schedule } from '../../types';

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group bg-surface-container-low hover:bg-surface-container rounded-[1.5rem] p-8 transition-all duration-300 editorial-shadow hover:shadow-[0_24px_48px_rgba(0,73,37,0.12)]">
    <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h4 className="text-xl font-bold text-on-surface mb-3">{title}</h4>
    <p className="text-on-surface-variant leading-relaxed">{description}</p>
  </div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, deviceId } = useAuthStore();
  const { 
    savedSchedules, 
    fetchSchedules, 
    setCurrentSchedule, 
    saveSchedule,
    deleteSchedule 
  } = useScheduleStore();
  const { hasAnimated, setHasAnimated, isProcessing, setIsProcessing } = useUIStore();

  useEffect(() => {
    if (deviceId) {
      fetchSchedules(deviceId);
    }
  }, [deviceId, fetchSchedules]);

  useEffect(() => {
    if (!hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasAnimated, setHasAnimated]);

  const fadeUpVariants: Variants = hasAnimated
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.7,
            delay: 0.3 + i * 0.15,
            ease: [0.25, 0.4, 0.25, 1] as const,
          },
        }),
      };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const mimeType = file.type;
        try {
          let parsedResult;
          if (mimeType === 'application/pdf') {
            try {
              parsedResult = await parseScheduleFileWithEdge(base64data);
            } catch {
              parsedResult = await parseScheduleFile(base64data, mimeType);
            }
          } else {
            parsedResult = await parseScheduleFile(base64data, mimeType);
          }

          const { sessions, faculty, academic_period } = parsedResult;
          const newSchedule: Schedule = {
            title: 'Mi Horario Academico',
            sessions,
            lastUpdated: new Date(),
            academic_period: academic_period || 'SEPTIEMBRE 2025 - ENERO 2026',
            faculty: faculty || 'FACULTAD DE CIENCIAS INFORMATICAS',
          };

          setCurrentSchedule(newSchedule);

          if (deviceId) {
            const saved = await saveSchedule(deviceId, newSchedule);
            if (saved?.id) {
              navigate(`/schedule/${saved.id}`);
            } else {
              navigate('/schedule/current');
            }
          } else {
            navigate('/schedule/current');
          }
        } catch (err: any) {
          alert(err.message || 'No se pudo procesar el documento.');
        } finally {
          setIsProcessing(false);
        }
      };
    } catch {
      setIsProcessing(false);
      alert('Error al leer el archivo.');
    }
  };

  const handleOpenSchedule = async (id: string) => {
    navigate(`/schedule/${id}`);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm('¿Estas seguro de eliminar este horario?')) {
      try {
        await deleteSchedule(id);
      } catch (e: any) {
        alert(e.message || 'No se pudo eliminar el horario.');
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`¿Estas seguro de eliminar ${ids.length} horarios?`)) {
      try {
        await Promise.all(ids.map(id => deleteSchedule(id)));
      } catch {
        alert('Error al eliminar los horarios.');
      }
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'estudiante';

  // Authenticated user view
  if (user) {
    return (
      <div className="flex flex-col items-center pb-16 w-full relative z-10">
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl mx-auto pt-10 px-4"
        >
          <div className="bg-surface-container-lowest rounded-[1.8rem] p-6 md:p-8 editorial-shadow border border-outline-variant/20">
            <span className="label-md text-secondary block mb-3">GESTOR DE HORARIOS</span>
            <h1 className="headline-md text-on-surface mb-2">
              Bienvenido, <span className="text-primary">{displayName}</span>
            </h1>
            <p className="body-lg text-on-surface-variant mb-6">
              Aqui puedes ver tus horarios guardados, crear uno nuevo y exportarlos cuando lo necesites.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('uploader-select-btn')?.click()}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-container transition-colors"
              >
                Crear mi horario
              </button>
              <button
                onClick={() => navigate('/about')}
                className="bg-surface-container text-on-surface px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-container-high transition-colors"
              >
                Ver guia
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl mt-8 px-4"
        >
          <h2 className="title-lg text-on-surface mb-4">Tus horarios</h2>
          {savedSchedules.length > 0 ? (
            <ScheduleList
              schedules={savedSchedules}
              onOpen={handleOpenSchedule}
              onDelete={handleDeleteSchedule}
              onBulkDelete={handleBulkDelete}
              onCreateNew={() => document.getElementById('uploader-select-btn')?.click()}
            />
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 text-center editorial-shadow">
              <h3 className="text-2xl font-bold text-on-surface mb-2">Crea tu horario</h3>
              <p className="text-on-surface-variant mb-6">
                Aun no tienes horarios guardados. Sube tu PDF del Sistema de Gestion Academica para generar tu primer horario.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl mt-8 px-4"
        >
          <Uploader onUpload={handleUpload} isProcessing={isProcessing} />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl w-full px-4"
        >
          <FeatureCard
            icon={<LayoutDashboard size={24} />}
            title="Extraccion Inteligente"
            description="Convierte instantaneamente tu reporte de matricula PDF en un horario digital interactivo y editable."
          />
          <FeatureCard
            icon={<FileText size={24} />}
            title="Exportacion PDF"
            description="Descarga tu horario en PDF de alta calidad listo para imprimir, con la paleta UTM."
          />
          <FeatureCard
            icon={<PenTool size={24} />}
            title="Personalizacion"
            description="Ajusta colores por materia y temas visuales para que tu horario refleje tu estilo."
          />
        </motion.div>
      </div>
    );
  }

  // Public landing view
  return (
    <div className="flex flex-col items-center pb-16 w-full relative z-10">
      {/* Hero */}
      <div className="w-full max-w-4xl mx-auto pt-12 pb-10 px-4 text-center">
        <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible">
          <span className="label-md text-secondary block mb-6">GESTION ACADEMICA UTM</span>
        </motion.div>
        <motion.h1
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="display-lg text-on-surface mb-4 max-w-3xl mx-auto"
        >
          Transforma tu horario academico en una{' '}
          <span className="italic text-primary">agenda digital impecable.</span>
        </motion.h1>
        <motion.p
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="body-lg text-on-surface-variant max-w-xl mx-auto mb-8"
        >
          Carga tu PDF del reporte de matricula UTM y obten un horario digital interactivo en segundos.
        </motion.p>
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => document.getElementById('uploader-select-btn')?.click()}
            className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg shadow-editorial hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            Cargar mi Horario
          </button>
          <button
            onClick={() => navigate('/about')}
            className="text-on-surface-variant font-semibold hover:text-primary transition-colors duration-200 flex items-center gap-2"
          >
            Ver como funciona →
          </button>
        </motion.div>
      </div>

      {/* Uploader */}
      <motion.div
        custom={4}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl px-4"
      >
        <Uploader onUpload={handleUpload} isProcessing={isProcessing} />
      </motion.div>

      {/* Saved schedules for guests */}
      {savedSchedules.length > 0 && (
        <motion.div
          custom={5}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl mt-14 px-4"
        >
          <ScheduleList
            schedules={savedSchedules}
            onOpen={handleOpenSchedule}
            onDelete={handleDeleteSchedule}
            onBulkDelete={handleBulkDelete}
            onCreateNew={() => document.getElementById('uploader-select-btn')?.click()}
          />
        </motion.div>
      )}

      {/* Feature Cards */}
      <motion.div
        custom={6}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl w-full px-4"
      >
        <FeatureCard
          icon={<LayoutDashboard size={24} />}
          title="Extraccion Inteligente"
          description="Convierte instantaneamente tu reporte de matricula PDF en un horario digital interactivo y editable."
        />
        <FeatureCard
          icon={<FileText size={24} />}
          title="Exportacion PDF"
          description="Descarga tu horario en PDF de alta calidad listo para imprimir, con la paleta UTM."
        />
        <FeatureCard
          icon={<PenTool size={24} />}
          title="Personalizacion"
          description="Ajusta colores por materia y temas visuales para que tu horario refleje tu estilo."
        />
      </motion.div>
    </div>
  );
};
