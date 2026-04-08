import React, { useState } from 'react';
import { LogOut, Calendar, Trash2, Plus, ArrowLeft, Check, CheckSquare, X } from 'lucide-react';
import { UserProfile } from '../types';

interface ScheduleSummary {
  id: string;
  title: string;
  academic_period?: string;
  last_updated: string;
}

interface ScheduleListProps {
  user?: UserProfile;
  schedules: ScheduleSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onLogout?: () => void;
  onCreateNew: () => void;
  onBack?: () => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ 
  user, 
  schedules, 
  onOpen, 
  onDelete,
  onBulkDelete,
  onLogout,
  onCreateNew,
  onBack
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map(s => s.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* User Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Volver"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              {user?.full_name ? user.full_name[0] : (user?.email ? user.email[0].toUpperCase() : 'H')}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user?.full_name?.split(' ')[0] || 'Mis Horarios'}
            </h2>
            {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
          </div>
        </div>
        
        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-destructive hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        )}
      </div>

      {/* List Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Mis Horarios</h3>
          <p className="text-sm text-muted-foreground">{schedules.length} guardados</p>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
           {selectedIds.length > 0 && onBulkDelete ? (
             <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 text-white bg-destructive hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm animate-in fade-in zoom-in duration-150"
              >
               <Trash2 size={16} /> 
               Eliminar ({selectedIds.length})
             </button>
          ) : null}
          
          {schedules.length > 0 && (
             <button 
                onClick={toggleSelectAll}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${selectedIds.length === schedules.length ? 'text-primary bg-primary/10 border-primary' : 'text-muted-foreground border-muted hover:border-primary/50'}`}
                title="Seleccionar todos"
              >
                <CheckSquare size={18} />
                <span className="hidden sm:inline">Seleccionar todos</span>
            </button>
          )}

           <button 
             onClick={onCreateNew}
             className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-cyan-300 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)]"
           >
             <Plus size={18} />
             <span className="hidden sm:inline">Nuevo</span>
           </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-2xl border-2 border-dashed border-muted flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center shadow-sm mb-4 text-primary">
               <Calendar size={32} />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-1">Sin horarios guardados</h4>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">Carga una imagen o PDF de tu horario para comenzar.</p>
            <button 
              onClick={onCreateNew}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Crear Horario
            </button>
          </div>
        ) : (
          schedules.map(schedule => {
            const isSelected = selectedIds.includes(schedule.id);
            const lastUpdatedDate = new Date(schedule.last_updated);
            const formattedDate = !isNaN(lastUpdatedDate.getTime()) ? lastUpdatedDate.toLocaleDateString() : 'Fecha desconocida';
            
            return (
              <div 
                key={schedule.id} 
                onClick={() => onOpen(schedule.id)}
                className={`
                  bg-card rounded-xl p-3 border-2 transition-all duration-200 cursor-pointer group flex items-center gap-4 relative overflow-hidden
                  ${isSelected ? 'border-primary shadow-[0_0_15px_rgba(0,240,255,0.15)] bg-primary/5' : 'border-muted hover:shadow-lg hover:border-muted/80'}
                `}
              >
                {/* Custom Checkbox */}
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleSelection(schedule.id); }}
                  className={`
                    w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 z-10
                    ${isSelected ? 'bg-primary border-primary' : 'bg-card border-muted hover:border-primary'}
                  `}
                >
                  {isSelected && <Check size={14} className="text-primary-foreground" />}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-primary shrink-0">
                   <Calendar size={24} />
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                   <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary">
                      {schedule.title}
                   </h4>
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                     {schedule.academic_period || `Actualizado: ${formattedDate}`}
                   </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                   <button 
                    onClick={(e) => handleDeleteClick(e, schedule.id)}
                    type="button"
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors z-20"
                    title="Eliminar horario"
                   >
                     <Trash2 size={18} />
                   </button>

                   <button 
                    onClick={(e) => { e.stopPropagation(); onOpen(schedule.id); }}
                    type="button"
                    className="hidden sm:block px-6 py-2 bg-card border border-muted text-foreground font-semibold rounded-lg hover:bg-muted transition-all text-sm z-20"
                   >
                     Abrir
                   </button>
                </div>

              </div>
            );
          })
        )}
      </div>
      
      {/* Mobile Floating Action Button */}
      {schedules.length > 0 && !selectedIds.length && (
         <button 
           onClick={onCreateNew}
           className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95"
         >
           <Plus size={28} />
         </button>
      )}

    </div>
  );
};

export default ScheduleList;