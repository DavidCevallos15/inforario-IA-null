import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileText, PenTool, Sparkles } from 'lucide-react';
import { AppView } from '../../types';
import { DropZone as Uploader } from '../uploader/components/DropZone';
import { SavedSchedulesList as ScheduleList } from './components/SavedSchedulesList';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="group rounded-[1.5rem] border border-outline/40 bg-surface-container-low p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-editorial">
    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-success-container text-primary-fixed transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <h4 className="mb-3 text-xl font-bold text-on-surface">{title}</h4>
    <p className="text-sm leading-relaxed text-on-surface-variant">{description}</p>
  </div>
);

interface LandingPageProps {
  sessionUser: any;
  userProfile: any;
  savedSchedules: any[];
  isProcessing: boolean;
  showUploaderInDashboard: boolean;
  setShowUploaderInDashboard: (show: boolean) => void;
  onUpload: (file: File) => Promise<void>;
  onOpenSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onSignOut: () => void;
  onNavigate: (view: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  sessionUser,
  userProfile,
  savedSchedules,
  isProcessing,
  showUploaderInDashboard,
  setShowUploaderInDashboard,
  onUpload,
  onOpenSchedule,
  onDeleteSchedule,
  onBulkDelete,
  onSignOut,
  onNavigate,
}) => {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.1 + i * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  const displayName =
    userProfile?.full_name ||
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.email?.split("@")[0] ||
    "estudiante";

  return (
    <div className="flex flex-col items-center pb-16 w-full relative z-10">
      {/* Decorative Blob */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,73,37,0.04) 0%, transparent 70%)",
        }}
      />

      {sessionUser ? (
        <>
          {/* Logged In Dashboard welcome */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl mx-auto pt-10 px-4"
          >
            <div className="rounded-[1.8rem] border border-outline/40 bg-surface-container-low p-6 editorial-shadow md:p-8">
              <span className="label-md mb-3 block text-xs font-semibold uppercase tracking-wider text-secondary">
                GESTOR DE HORARIOS
              </span>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Bienvenido, <span className="text-primary-fixed">{displayName}</span>
              </h1>
              <p className="text-on-surface-variant mb-6 text-sm md:text-base leading-relaxed">
                Aquí puedes ver tus horarios guardados, crear uno nuevo y exportarlos cuando lo necesites.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const uploaderBtn = document.getElementById("uploader-select-btn");
                    if (uploaderBtn) {
                      uploaderBtn.click();
                    } else {
                      setShowUploaderInDashboard(true);
                    }
                  }}
                  className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors duration-200 text-sm"
                >
                  Crear mi horario
                </button>
                <button
                  onClick={() => onNavigate(AppView.ABOUT)}
                  className="bg-surface-container text-on-surface px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-container-high transition-colors duration-200 text-sm"
                >
                  Ver guía
                </button>
              </div>
            </div>
          </motion.div>

          {/* Saved Schedules */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl mt-8 px-4"
          >
            <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-4">
              Tus horarios
            </h2>

            {savedSchedules.length > 0 ? (
              <ScheduleList
                schedules={savedSchedules}
                onOpen={onOpenSchedule}
                onDelete={onDeleteSchedule}
                onBulkDelete={onBulkDelete}
                onLogout={onSignOut}
                onCreateNew={() => setShowUploaderInDashboard(true)}
              />
            ) : (
              <div className="rounded-2xl border border-outline/40 bg-surface-container-low p-8 text-center editorial-shadow">
                <h3 className="mb-2 text-2xl font-bold text-on-surface">
                  Crea tu horario
                </h3>
                <p className="text-on-surface-variant mb-6 text-sm">
                  Aún no tienes horarios guardados. Sube tu PDF del SGU para generar tu primer horario.
                </p>
              </div>
            )}
          </motion.div>

          {/* Uploader container if requested */}
          {(showUploaderInDashboard || savedSchedules.length === 0) && (
            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-2xl mt-8 px-4"
            >
              <Uploader
                onUpload={onUpload}
                isProcessing={isProcessing}
              />
            </motion.div>
          )}
        </>
      ) : (
        <>
          {/* Guest Hero Section */}
          <div className="w-full max-w-4xl mx-auto pt-12 pb-10 px-4 text-center">
            <motion.div
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <span className="label-md text-secondary block mb-6 font-bold tracking-widest text-xs">
                GESTIÓN ACADÉMICA UTM
              </span>
            </motion.div>
            
            <motion.h1
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface mb-4 max-w-3xl mx-auto"
            >
              Transforma tu horario SGU en una{" "}
              <span className="text-primary-fixed">
                agenda digital impecable.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-on-surface-variant max-w-xl mx-auto mb-8 text-sm md:text-lg leading-relaxed"
            >
              Carga tu PDF del reporte de matrícula UTM y obtén un horario digital interactivo en segundos.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <button
                onClick={() => {
                  const fileInput = document.getElementById("uploader-file-input");
                  if (fileInput) fileInput.click();
                }}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg shadow-editorial hover:scale-105 active:scale-95 transition-transform duration-200"
              >
                Cargar mi Horario
              </button>
              <button
                onClick={() => onNavigate(AppView.ABOUT)}
                className="flex items-center gap-2 text-base font-semibold text-on-surface-variant transition-colors duration-200 hover:text-primary-fixed"
              >
                Ver cómo funciona →
              </button>
            </motion.div>
          </div>

          {/* Guest Uploader Zone */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl px-4"
          >
            <Uploader
              onUpload={onUpload}
              isProcessing={isProcessing}
            />
          </motion.div>

          {/* Guest Saved Schedules List if they exist locally */}
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
                onOpen={onOpenSchedule}
                onDelete={onDeleteSchedule}
                onBulkDelete={onBulkDelete}
                onLogout={onSignOut}
                onCreateNew={() => setShowUploaderInDashboard(true)}
              />
            </motion.div>
          )}
        </>
      )}

      {/* Feature Cards Grid */}
      <motion.div
        custom={6}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl w-full px-4"
      >
        <FeatureCard
          icon={<LayoutDashboard size={24} />}
          title="Extracción Inteligente"
          description="Convierte instantáneamente tu reporte de matrícula PDF en un horario digital interactivo y editable."
        />
        <FeatureCard
          icon={<FileText size={24} />}
          title="Exportación PDF"
          description="Descarga tu horario en PDF de alta calidad listo para imprimir, con la paleta UTM."
        />
        <FeatureCard
          icon={<PenTool size={24} />}
          title="Personalización"
          description="Ajusta colores por materia y temas visuales para que tu horario refleje tu estilo."
        />
      </motion.div>
    </div>
  );
};

export default LandingPage;
