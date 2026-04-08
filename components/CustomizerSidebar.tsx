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

const COLORS = [
  '#00F0FF', // Cyan (Primary)
  '#FF006E', // Pink (Secondary)
  '#FFBE0B', // Amber (Accent)
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#8338EC', // Purple
  '#00FFB3', // Green Neon
  '#f97316', // Orange
];

const THEMES: { id: ScheduleTheme; name: string; description: string; previewClass: string }[] = [
  { 
    id: 'DEFAULT', 
    name: 'Futurista', 
    description: 'Modo oscuro por defecto.',
    previewClass: 'bg-[#151B3B] border-[#1E2749]' 
  },
  { 
    id: 'MINIMALIST', 
    name: 'Ejecutivo', 
    description: 'Estilo empresarial, blanco y negro.',
    previewClass: 'bg-white border-black border-2' 
  },
  { 
    id: 'SCHOOL', 
    name: 'Escolar', 
    description: 'Creativo, fondo de papel y colores vivos.',
    previewClass: 'bg-yellow-50 border-orange-300 border-dashed' 
  },
  { 
    id: 'NEON', 
    name: 'Cyberpunk', 
    description: 'Modo oscuro con bordes neón intensos.',
    previewClass: 'bg-slate-900 border-cyan-500 text-cyan-400' 
  }
];

const CustomizerSidebar: React.FC<CustomizerSidebarProps> = ({ 
  isOpen, 
  onClose, 
  schedule, 
  onColorChange,
  currentTheme,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'design'>('colors');

  // Extract unique subjects
  const subjects = Array.from(new Set(schedule.sessions.map(s => s.subject))) as string[];

  // Helper to find current color of a subject
  const getSubjectColor = (subject: string) => {
    const session = schedule.sessions.find(s => s.subject === subject);
    return session?.color || '#00F0FF';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-primary/20 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-muted flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-2 text-foreground">
            <Palette size={20} className="text-primary"/>
            <h2 className="font-bold text-lg">Personalizar</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-muted">
          <button 
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'colors' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Palette size={16} /> Colores
          </button>
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Layout size={16} /> Diseño
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div className="bg-primary/10 p-3 rounded-lg text-xs text-primary mb-4 border border-primary/20">
                Personaliza el color de cada materia para identificarla rápidamente.
              </div>
              
              {subjects.map(subject => (
                <div key={subject} className="bg-background border border-muted rounded-xl p-3 shadow-sm">
                  <h4 className="font-bold text-foreground text-sm mb-3 line-clamp-1" title={subject}>
                    {subject}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => onColorChange(subject, color)}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 border-2 ${getSubjectColor(subject) === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg text-xs text-primary mb-2 border border-primary/20">
                Elige un tema visual para tu horario.
              </div>

              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all group ${currentTheme === theme.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground">{theme.name}</span>
                    {currentTheme === theme.id && <div className="bg-primary text-primary-foreground rounded-full p-0.5"><Check size={12}/></div>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{theme.description}</p>
                  
                  {/* Mini Preview */}
                  <div className={`h-12 w-full rounded-md flex items-center justify-center ${theme.previewClass}`}>
                     <div className="text-[10px] opacity-70 font-bold mix-blend-difference text-white">10:00 - MATEMATICAS</div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-muted bg-muted/10 text-center text-xs text-muted-foreground">
          Personalizador de Inforario
        </div>
      </div>
    </>
  );
};

export default CustomizerSidebar;