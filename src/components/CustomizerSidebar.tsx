import React, { useState } from 'react';
import { X, Palette, Layout, Check } from 'lucide-react';
import { Schedule, ScheduleTheme } from '../types';

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
  '#a1f5b8', // primary-fixed (verde menta)
  '#004925', // primary (verde UTM)
  '#fcb812', // secondary-container (dorado UTM)
  '#86d89d', // primary-fixed-dim
  '#ffdea7', // secondary-fixed
  '#dee3e8', // tertiary-fixed
  '#c1c7cc', // tertiary-fixed-dim
  '#ffdad6', // error-container
  '#006334', // primary-container
  '#50565b', // tertiary-container
];

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

const CustomizerSidebar: React.FC<CustomizerSidebarProps> = ({
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
    return session?.color || '#a1f5b8';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-surface-container-lowest shadow-editorial-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 flex justify-between items-center bg-surface-container-high">
          <div className="flex items-center gap-2 text-on-surface">
            <Palette size={20} className="text-primary" />
            <h2 className="font-bold text-lg">Personalizar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/30"
            aria-label="Cerrar personalizador"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-3 gap-2 bg-surface-container-low">
          <button
            onClick={() => setActiveTab('colors')}
            id="customizer-tab-colors"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors
              ${activeTab === 'colors'
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <Palette size={15} /> Colores
          </button>
          <button
            onClick={() => setActiveTab('design')}
            id="customizer-tab-design"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors
              ${activeTab === 'design'
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <Layout size={15} /> Diseño
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="bg-primary-fixed/40 p-3 rounded-xl text-xs text-on-primary-fixed-variant mb-2 font-medium">
                Personaliza el color de cada materia para identificarla rápidamente.
              </div>

              {subjects.map((subject) => (
                <div key={subject} className="bg-surface-container-low rounded-xl p-4 shadow-editorial">
                  <h4 className="font-bold text-on-surface text-sm mb-3 line-clamp-1" title={subject}>
                    {subject}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => onColorChange(subject, color)}
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 border-2
                          ${getSubjectColor(subject) === color
                            ? 'border-on-surface scale-110 shadow-editorial'
                            : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Color ${color} para ${subject}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-3">
              <div className="bg-primary-fixed/40 p-3 rounded-xl text-xs text-on-primary-fixed-variant mb-2 font-medium">
                Elige un tema visual para tu horario.
              </div>

              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  id={`customizer-theme-${theme.id.toLowerCase()}`}
                  className={`w-full text-left p-4 rounded-xl transition-all group
                    ${currentTheme === theme.id
                      ? 'bg-primary-fixed/30 ring-2 ring-primary/30 shadow-editorial'
                      : 'bg-surface-container-low hover:bg-surface-container'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-on-surface text-sm">{theme.name}</span>
                    {currentTheme === theme.id && (
                      <div className="bg-primary text-on-primary rounded-full p-0.5">
                        <Check size={11} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">{theme.description}</p>

                  {/* Mini preview */}
                  <div className={`h-10 w-full rounded-lg flex items-center justify-center ${theme.previewClass}`}>
                    <div className="text-[9px] opacity-70 font-bold px-2 py-0.5 rounded"
                      style={theme.id === 'DEFAULT' ? { background: '#a1f5b8', color: '#00522a' } : {}}>
                      10:00 — MATEMÁTICAS
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low text-center text-xs text-on-surface-variant">
          Personalizador · Inforario v3.0
        </div>
      </div>
    </>
  );
};

export default CustomizerSidebar;