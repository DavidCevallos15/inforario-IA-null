import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Schedule, ScheduleTheme } from '../../../types';
import { DEFAULT_HIGHLIGHTER, HIGHLIGHTERS, inkOn } from '../../../lib/highlighters';

interface CustomizerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  onColorChange: (subject: string, color: string) => void;
  currentTheme: ScheduleTheme;
  onThemeChange: (theme: ScheduleTheme) => void;
}

const COLORS = HIGHLIGHTERS;
const DEFAULT_COLOR = DEFAULT_HIGHLIGHTER;

// Estos estilos solo cambian el PDF exportado; la pantalla sigue al tema del dispositivo
const THEMES: { id: ScheduleTheme; name: string; description: string; previewClass: string }[] = [
  { id: 'DEFAULT', name: 'Cuaderno', description: 'Hoja blanca con tus materias en resaltador.', previewClass: 'paper-grid' },
  { id: 'MINIMALIST', name: 'Imprenta', description: 'Blanco y negro, ideal para la copiadora.', previewClass: 'bg-white ring-1 ring-black' },
  { id: 'SCHOOL', name: 'Escolar', description: 'Papel cálido y bordes marcados.', previewClass: 'bg-[#fffdf0] ring-1 ring-orange-300' },
  { id: 'NEON', name: 'Pizarra', description: 'Fondo oscuro, para ver en pantalla.', previewClass: 'bg-[#11161f]' },
];

export const CustomizerSidebar: React.FC<CustomizerSidebarProps> = ({
  isOpen,
  onClose,
  schedule,
  onColorChange,
  currentTheme,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'design'>('colors');

  const subjects = Array.from(new Set(schedule.sessions.map((s) => s.subject))) as string[];

  const getSubjectColor = (subject: string) => {
    const session = schedule.sessions.find((s) => s.subject === subject);
    return session?.color || DEFAULT_COLOR;
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-50 bg-inverse-surface/30" onClick={onClose} />}

      <aside
        aria-label="Personalizar"
        aria-hidden={!isOpen}
        className={`paper-grid fixed right-0 top-0 z-50 flex h-full w-[min(22rem,100vw)] flex-col shadow-editorial-lg transition-transform duration-300 ease-disclosure ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
          <h3 className="text-lg font-extrabold text-on-surface">Personalizar</h3>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div role="tablist" className="flex border-b border-outline-variant bg-surface-container-lowest">
          {(['colors', 'design'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-3 text-sm font-bold transition-colors ${
                activeTab === tab ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'colors' ? 'Colores' : 'Estilo del PDF'}
              {activeTab === tab && <span aria-hidden className="absolute inset-x-6 bottom-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {activeTab === 'colors' ? (
            subjects.map((subject) => {
              const currentColor = getSubjectColor(subject);
              return (
                <div key={subject} className="rounded bg-surface-container-lowest p-3 shadow-editorial">
                  <p className="text-sm font-extrabold leading-snug text-on-surface">
                    <span className="highlight" style={{ ['--hl' as string]: currentColor }}>{subject}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={`Color de ${subject}`}>
                    {COLORS.map(({ hex, name }) => (
                      <button
                        key={hex}
                        type="button"
                        role="radio"
                        aria-checked={currentColor === hex}
                        aria-label={name}
                        onClick={() => onColorChange(subject, hex)}
                        className={`grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                          currentColor === hex ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {currentColor === hex && <Check size={14} strokeWidth={3} style={{ color: inkOn(hex) }} />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onThemeChange(t.id)}
                  aria-pressed={currentTheme === t.id}
                  className={`flex items-start gap-3 rounded bg-surface-container-lowest p-4 text-left transition-shadow ${
                    currentTheme === t.id ? 'shadow-editorial ring-2 ring-primary' : 'shadow-editorial hover:shadow-editorial-lg'
                  }`}
                >
                  <span className={`h-9 w-9 shrink-0 rounded-sm ${t.previewClass}`} />
                  <span>
                    <span className="block text-sm font-extrabold text-on-surface">{t.name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
