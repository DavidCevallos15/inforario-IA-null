import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { ScheduleSummary, UserProfile } from '../../types';
import { DropZone } from '../uploader/components/DropZone';
import { SavedSchedulesList } from './components/SavedSchedulesList';
import { BeforeAfter } from './components/BeforeAfter';
import { SguReportPreview } from './components/SguReportPreview';
import { DemoDayList, DemoWeekGrid } from './components/DemoWeek';
import { Reveal } from '../../components/notebook/Reveal';
import { InkCircle } from '../../components/notebook/InkCircle';
import { SIGNATURE } from '../../components/notebook/signaturePath';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { assignSubjectColors, parseSguTextItems, resolveConflicts } from '../uploader/utils/sguRegexParser';
import type { TextItem } from '../uploader/utils/pdfText';
import sguReportFixture from '../uploader/utils/__fixtures__/sguReport.json';
import { dur, ease } from '../../lib/motion';

interface LandingPageProps {
  sessionUser: User | null;
  userProfile: UserProfile | null;
  savedSchedules: ScheduleSummary[];
  isProcessing: boolean;
  showUploaderInDashboard: boolean;
  setShowUploaderInDashboard: (show: boolean) => void;
  onUpload: (file: File) => Promise<void>;
  onOpenSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

const STEPS = [
  {
    title: 'Descarga tu PDF del SGU',
    text: 'Entra al SGU de la UTM y descarga tu reporte Horario de clases en PDF.',
  },
  {
    title: 'Súbelo aquí',
    text: 'Tócalo o arrástralo al recuadro. Se lee en tu dispositivo en un par de segundos.',
  },
  {
    title: 'Llévalo a tu calendario',
    text: 'Descárgalo en .ics para Google Calendar, Apple u Outlook, o en PDF para imprimirlo.',
  },
];

const scrollToUploader = () => {
  document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => document.getElementById('uploader-select-btn')?.focus({ preventScroll: true }), 500);
};

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
}) => {
  if (sessionUser) {
    const displayName =
      userProfile?.full_name?.split(' ')[0] ||
      (sessionUser.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
      sessionUser.email?.split('@')[0] ||
      'estudiante';

    return (
      <div className="mx-auto w-full max-w-4xl pb-16 pt-8 sm:pt-12">
        <Reveal>
          <p className="ink text-2xl font-bold">Hola, {displayName}</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-[-0.03em] text-on-surface sm:text-5xl">Tus horarios</h1>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          {savedSchedules.length > 0 ? (
            <SavedSchedulesList
              schedules={savedSchedules}
              onOpen={onOpenSchedule}
              onDelete={onDeleteSchedule}
              onBulkDelete={onBulkDelete}
              onCreateNew={() => {
                setShowUploaderInDashboard(true);
                window.setTimeout(scrollToUploader, 50);
              }}
            />
          ) : (
            <p className="max-w-[52ch] text-base leading-7 text-on-surface-variant">
              Todavía no tienes horarios guardados. Sube tu PDF del SGU y quedará guardado en tu cuenta.
            </p>
          )}
        </Reveal>

        {(showUploaderInDashboard || savedSchedules.length === 0) && (
          <Reveal delay={0.12} className="mt-10" id="subir">
            <DropZone onUpload={onUpload} isProcessing={isProcessing} variant="compact" />
          </Reveal>
        )}
      </div>
    );
  }

  return <GuestLanding isProcessing={isProcessing} onUpload={onUpload} />;
};

const GuestLanding: React.FC<{ isProcessing: boolean; onUpload: (file: File) => Promise<void> }> = ({
  isProcessing,
  onUpload,
}) => {
  const reduce = useReducedMotion();
  const isWide = useMediaQuery('(min-width: 768px)');

  // La demostración usa el parser real sobre un reporte del SGU anonimizado
  const demo = useMemo(() => {
    const items = sguReportFixture as TextItem[];
    // Único dato inventado de la demo (y se dice en el texto): Estadística, que en el reporte no tiene
    // horario, se ubica el lunes para mostrar cómo se marca un choque
    const sessions = parseSguTextItems(items).sessions.map((s) =>
      s.subject === 'ESTADISTICA'
        ? { ...s, day: 'Lunes' as const, startTime: '10:00', endTime: '12:00', location: 'Aula 105 - Piso 1 - Ciencias Básicas I', floor: '1' }
        : s
    );
    return { items, sessions: resolveConflicts(assignSubjectColors(sessions)) };
  }, []);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0.4, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: dur.reveal, ease: ease.reveal, delay },
        };

  return (
    <div className="w-full">
      {/* ---------- Portada: la acción vive aquí ---------- */}
      <section className="pb-16 pt-8 sm:pb-24 sm:pt-14" aria-labelledby="hero-title">
        <motion.h1
          id="hero-title"
          {...enter(0)}
          className="max-w-[16ch] text-[2.6rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-on-surface sm:text-6xl lg:text-7xl"
        >
          Tu horario del SGU, <span className="highlight">pasado en limpio.</span>
        </motion.h1>
        <motion.p
          {...enter(0.08)}
          className="mt-5 max-w-[44ch] text-lg leading-7 text-on-surface-variant sm:text-xl sm:leading-8"
        >
          Sube el PDF que descargas del SGU y mira tu semana: aulas, edificios, docentes y choques de horario.
        </motion.p>
        <motion.div {...enter(0.16)} id="subir" className="mt-10 max-w-3xl">
          <DropZone onUpload={onUpload} isProcessing={isProcessing} />
        </motion.div>
      </section>

      {/* ---------- Antes y después ---------- */}
      <section className="pb-20 sm:pb-28" aria-labelledby="demo-title">
        <Reveal>
          <h2 id="demo-title" className="text-3xl font-extrabold tracking-[-0.03em] text-on-surface sm:text-4xl">
            Del PDF a tu semana
          </h2>
          <p className="mt-3 max-w-[56ch] text-base leading-7 text-on-surface-variant sm:text-lg">
            Un reporte real con los datos cambiados, más un choque de horario para que veas cómo se marca. Desliza la línea:
            a un lado lo que te da el SGU, al otro lo que ves en Inforario.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-8">
          <BeforeAfter
            key={isWide ? 'wide' : 'narrow'}
            className={isWide ? 'aspect-[16/10]' : 'aspect-[3/4]'}
            beforeLabel="PDF del SGU"
            afterLabel="Inforario"
            restAt={isWide ? 30 : 24}
            before={<SguReportPreview items={demo.items} fit={isWide ? 'width' : 'height'} />}
            after={
              isWide ? <DemoWeekGrid sessions={demo.sessions} offsetPct={30} /> : <DemoDayList sessions={demo.sessions} offsetPct={24} />
            }
          />
        </Reveal>
      </section>

      {/* ---------- Tres pasos ---------- */}
      <section className="pb-20 sm:pb-28" aria-labelledby="pasos-title">
        <Reveal>
          <h2 id="pasos-title" className="text-3xl font-extrabold tracking-[-0.03em] text-on-surface sm:text-4xl">
            Así de simple
          </h2>
        </Reveal>
        <ol className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-[1.1fr_1fr_1fr]">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0.4, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: dur.reveal, ease: ease.reveal, delay: i * 0.08 }}
              // Escalonados como apuntes escritos uno debajo del otro
              className={`flex items-start gap-3 ${i === 1 ? 'md:pt-12' : i === 2 ? 'md:pt-24' : ''}`}
            >
              <InkCircle delay={0.15 + i * 0.12}>{i + 1}</InkCircle>
              <div className="pt-2">
                <h3 className="text-lg font-extrabold text-on-surface">{step.title}</h3>
                <p className="mt-1 max-w-[34ch] text-base leading-6 text-on-surface-variant">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ---------- Cierre: firma con esfero ---------- */}
      <section className="pb-12 sm:pb-16" aria-label="Inforario">
        <Signature />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={scrollToUploader}
            className="rounded-md bg-primary px-6 py-3.5 text-base font-bold text-on-primary shadow-editorial transition-colors duration-150 hover:bg-primary-container active:scale-[0.98]"
          >
            Subir mi PDF
          </button>
          <p className="text-sm text-on-surface-variant">
            Hecho por{' '}
            <a
              href="https://github.com/DavidCevallos15"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline decoration-primary/40 hover:decoration-primary"
            >
              DC.dev
            </a>
            , estudiante de la UTM.
          </p>
        </div>
      </section>
    </div>
  );
};

/**
 * "Inforario" firmado con esfero: un solo trazo que se escribe de izquierda a
 * derecha y termina en un rasgo que subraya la firma.
 * El detector de vista va en el contenedor (un elemento oculto no intersecta).
 */
const Signature: React.FC = () => {
  const reduce = useReducedMotion();
  const [ex, ey] = SIGNATURE.end;
  // El rasgo continúa desde el final de la "o" y vuelve por debajo de la palabra
  const flourish = `M${ex} ${ey} C ${ex + 40} ${ey + 30}, ${ex + 10} ${ey + 112}, ${ex - 170} ${ey + 118} C ${ex - 380} ${ey + 124}, 160 ${ey + 116}, 24 ${ey + 104}`;
  return (
    <motion.div
      className="w-full max-w-[42rem]"
      initial={reduce ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      <svg viewBox={`0 0 ${SIGNATURE.width + 40} ${SIGNATURE.height + 30}`} className="h-auto w-full overflow-visible" role="img" aria-label="Inforario">
        <motion.path
          d={SIGNATURE.d}
          fill="none"
          className="stroke-primary"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
          transition={{ duration: 2.2, ease: [0.45, 0.05, 0.25, 1] }}
        />
        <motion.path
          d={flourish}
          fill="none"
          className="stroke-primary"
          strokeWidth={6}
          strokeLinecap="round"
          variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
          transition={{ duration: 0.8, ease: ease.disclosure, delay: 2.15 }}
        />
      </svg>
    </motion.div>
  );
};

export default LandingPage;
