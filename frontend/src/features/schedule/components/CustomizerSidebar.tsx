import React, { useState } from 'react';
import { X, Palette, Layout, Check } from 'lucide-react';
import { Schedule, ScheduleTheme } from '../../../types';

interface CustomizerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  onColorChange: (subject: string, color: string) => void;
  currentTheme: ScheduleTheme;
  onThemeChange: (theme: ScheduleTheme) => void;
}

// Paleta derivada de tokens Academic Curator + colores complementarios
const COLORS = [
  '#22C55E',
  '#3B82F6',
  '#F97316',
  '#EF4444',
  '#A855F7',
  '#06B6D4',
  '#EAB308',
];

const DEFAULT_COLOR = COLORS[0];

const getTextColor = (bg: string) => {
  const cleaned = bg.replace('#', '').trim();
  if (cleaned.length !== 6) return '#111111';
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
};

const THEMES: { id: ScheduleTheme; name: string; description: string; previewClass: string }[] = [
  {
    id: 'DEFAULT',
    name: 'Academic Curator',
    description: 'Crema cálido con bloques verde UTM. Diseño editorial premium.',
    previewClass: 'bg-[#f6f3f2]',
  },
  {
    id: 'MINIMALIST',
    name: 'Ejecutivo',
    description: 'Estilo empresarial, blanco y negro clásico.',
    previewClass: 'bg-white border-black border-2',
  },
  {
    id: 'SCHOOL',
    name: 'Escolar',
    description: 'Creativo, fondo de papel y colores vivos.',
    previewClass: 'bg-yellow-50 border-orange-300 border-dashed',
  },
  {
    id: 'NEON',
    name: 'Cyberpunk',
    description: 'Modo oscuro con bordes neón intensos.',
    previewClass: 'bg-slate-900 border-cyan-500 text-cyan-400',
  },
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
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-surface-container-lowest border-r border-outline/40 shadow-editorial-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 flex justify-between items-center bg-surface-container-high border-b border-outline/40">
          <div className="flex items-center gap-2 text-on-surface">
            <Palette size={20} className="text-primary-fixed" />
            <h3 className="font-bold text-lg">Personalizar</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline/40 bg-surface-container-low">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'colors'
                ? 'border-primary-fixed text-primary-fixed bg-surface-container-lowest'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Materias
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'design'
                ? 'border-primary-fixed text-primary-fixed bg-surface-container-lowest'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Diseño
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'colors' ? (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Color de Asignaturas
              </h4>
              {subjects.map((subject) => {
                const currentColor = getSubjectColor(subject);
                return (
                  <div key={subject} className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl">
                    <span className="text-sm font-bold text-on-surface text-left break-words">
                      {subject}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => onColorChange(subject, color)}
                          className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {currentColor === color && (
                            <Check size={14} style={{ color: getTextColor(color) }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Tema del Horario
              </h4>
              <div className="grid gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      currentTheme === t.id
                        ? 'border-primary bg-primary/5 shadow-editorial'
                        : 'border-outline-variant/15 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 ${t.previewClass} flex items-center justify-center`}>
                      <Layout size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-on-surface">{t.name}</h5>
                      <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                        {t.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
