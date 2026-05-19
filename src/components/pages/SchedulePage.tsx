import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar as CalIcon,
  Download,
  PenTool,
  Check,
  RefreshCw,
  Palette,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '../../stores/authStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useUIStore } from '../../stores/uiStore';
import ScheduleGrid from '../ScheduleGrid';
import CustomizerSidebar from '../CustomizerSidebar';
import CalendarModal from '../modals/CalendarModal';
import ConfirmResetModal from '../modals/ConfirmResetModal';
import { generateICS } from '../../services/icsExport';
import { saveScheduleToDB } from '../../services/supabase';
import { DAYS } from '../../types';

export const SchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { user, profile, deviceId } = useAuthStore();
  const { 
    currentSchedule, 
    setCurrentSchedule, 
    openSchedule,
    theme, 
    setTheme,
    fontScale, 
    setFontScale,
    updateSessionColor,
    fetchSchedules
  } = useScheduleStore();
  const {
    customizerOpen,
    setCustomizerOpen,
    calendarModalOpen,
    setCalendarModalOpen,
    resetModalOpen,
    setResetModalOpen,
    isExporting,
    setIsExporting,
    actionsMenuOpen,
    setActionsMenuOpen,
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
  } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      if (id && id !== 'current' && (!currentSchedule || currentSchedule.id !== id)) {
        setIsLoading(true);
        await openSchedule(id);
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, [id, currentSchedule, openSchedule]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant">Cargando horario...</p>
        </div>
      </div>
    );
  }

  if (!currentSchedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <GraduationCap size={48} className="text-on-surface-variant mb-4" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">No hay horario cargado</h2>
        <p className="text-on-surface-variant mb-6">Sube un PDF para generar tu horario</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const startEditingTitle = () => {
    setTempTitle(currentSchedule.title);
    setIsEditingTitle(true);
  };

  const saveTitle = async () => {
    if (currentSchedule && tempTitle) {
      const updatedSchedule = { ...currentSchedule, title: tempTitle };
      setCurrentSchedule(updatedSchedule);
      if (deviceId && updatedSchedule.id) {
        await saveScheduleToDB(deviceId, updatedSchedule);
        fetchSchedules(deviceId);
      }
    }
    setIsEditingTitle(false);
  };

  const handleColorChange = async (subject: string, color: string) => {
    updateSessionColor(subject, color);
    if (deviceId && currentSchedule?.id) {
      await saveScheduleToDB(deviceId, {
        ...currentSchedule,
        sessions: currentSchedule.sessions.map(s => 
          s.subject === subject ? { ...s, color } : s
        )
      });
    }
  };

  const confirmReset = () => {
    setCurrentSchedule(null);
    setResetModalOpen(false);
    setTheme('DEFAULT');
    setFontScale(1);
    navigate('/');
  };

  // Helper to convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const handleDownload = async () => {
    if (!currentSchedule) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const themeConfig = {
        DEFAULT: {
          bg: [251, 249, 248],
          textMain: [27, 28, 28],
          textSec: [63, 73, 64],
          headerFill: [0, 73, 37],
          headerText: [255, 255, 255],
          gridLines: [191, 201, 190],
          timeText: [0, 73, 37],
          font: 'helvetica',
        },
        MINIMALIST: {
          bg: [255, 255, 255],
          textMain: [0, 0, 0],
          textSec: [50, 50, 50],
          headerFill: [255, 255, 255],
          headerText: [0, 0, 0],
          gridLines: [200, 200, 200],
          timeText: [0, 0, 0],
          font: 'times',
        },
        SCHOOL: {
          bg: [255, 253, 240],
          textMain: [67, 20, 7],
          textSec: [124, 45, 18],
          headerFill: [255, 237, 213],
          headerText: [154, 52, 18],
          gridLines: [253, 186, 116],
          timeText: [194, 65, 12],
          font: 'courier',
        },
        NEON: {
          bg: [15, 23, 42],
          textMain: [34, 211, 238],
          textSec: [165, 243, 252],
          headerFill: [2, 6, 23],
          headerText: [34, 211, 238],
          gridLines: [22, 78, 99],
          timeText: [8, 145, 178],
          font: 'courier',
        },
      };

      const style = themeConfig[theme];

      // Set Page Background
      doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header
      const centerX = pageWidth / 2;
      doc.setFont(style.font, 'bold');
      doc.setFontSize(18 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      doc.text('UNIVERSIDAD TECNICA DE MANABI', centerX, 15, { align: 'center' });

      doc.setFont(style.font, 'normal');
      doc.setFontSize(12 * fontScale);
      doc.setTextColor(style.textSec[0], style.textSec[1], style.textSec[2]);
      doc.text(currentSchedule.faculty || 'FACULTAD DE CIENCIAS INFORMATICAS', centerX, 22, { align: 'center' });

      doc.setFontSize(10 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      const studentName = profile?.full_name || user?.user_metadata?.full_name || 'ESTUDIANTE';
      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Estudiante: ${studentName}`, 15, 32);
      doc.text(`Periodo: ${currentSchedule.academic_period || 'SEPTIEMBRE 2025 - ENERO 2026'}`, centerX, 32, { align: 'center' });
      doc.text(`Generado: ${dateStr}`, pageWidth - 15, 32, { align: 'right' });

      // Grid Configuration
      const startX = 15;
      const startY = 40;
      const margin = 15;
      const usableWidth = pageWidth - margin * 2;

      const regularSessions = currentSchedule.sessions.filter(
        s => !s.isVirtual && s.day && s.startTime && s.endTime
      );
      const virtualSessions = currentSchedule.sessions.filter(
        s => s.isVirtual || !s.day || !s.startTime || !s.endTime
      );

      const timeColWidth = 20;
      const dayColWidth = (usableWidth - timeColWidth) / 5;
      const headerHeight = 10;

      // Calculate dynamic hour range
      let minHour = 7;
      let maxHour = 18;
      if (regularSessions.length > 0) {
        let min = 24, max = 0;
        regularSessions.forEach(s => {
          const startH = parseInt(s.startTime!.split(':')[0]);
          const endH = parseInt(s.endTime!.split(':')[0]) + (s.endTime!.includes(':30') ? 1 : 0);
          if (startH < min) min = startH;
          if (endH > max) max = endH;
        });
        minHour = Math.max(6, min - 1);
        maxHour = Math.max(minHour + 4, max + 1);
      }

      const baseHourHeight = Math.min(15 * fontScale, 20);
      const virtualColumns = virtualSessions.length >= 5 ? 3 : Math.min(2, Math.max(1, virtualSessions.length));
      const virtualCardHeight = virtualSessions.length > 0 ? 15 : 0;
      const virtualRows = virtualSessions.length > 0 ? Math.ceil(virtualSessions.length / virtualColumns) : 0;
      const virtualSectionHeight = virtualSessions.length > 0 ? 8 + virtualRows * (virtualCardHeight + 4) + 2 : 0;
      const availableGridHeight = pageHeight - startY - headerHeight - virtualSectionHeight - 12;
      const hourHeight = Math.min(baseHourHeight, availableGridHeight / Math.max(1, maxHour - minHour));
      const exportScale = Math.max(0.85, Math.min(1, hourHeight / baseHourHeight));
      const totalGridHeight = (maxHour - minHour) * hourHeight;

      // Draw Table Headers
      doc.setFillColor(style.headerFill[0], style.headerFill[1], style.headerFill[2]);
      doc.rect(startX, startY, usableWidth, headerHeight, 'F');
      if (theme === 'MINIMALIST') {
        doc.setDrawColor(0, 0, 0);
        doc.rect(startX, startY, usableWidth, headerHeight, 'S');
      }

      doc.setTextColor(style.headerText[0], style.headerText[1], style.headerText[2]);
      doc.setFontSize(10 * fontScale * exportScale);
      doc.setFont(style.font, 'bold');
      doc.text('Hora', startX + timeColWidth / 2, startY + 6.5, { align: 'center' });

      const daysEs = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
      daysEs.forEach((day, index) => {
        const xPos = startX + timeColWidth + index * dayColWidth + dayColWidth / 2;
        doc.text(day, xPos, startY + 6.5, { align: 'center' });
      });

      // Draw Grid Lines & Time Labels
      doc.setTextColor(style.timeText[0], style.timeText[1], style.timeText[2]);
      doc.setFontSize(9 * fontScale * exportScale);
      doc.setFont(style.font, 'normal');
      doc.setDrawColor(style.gridLines[0], style.gridLines[1], style.gridLines[2]);

      // Vertical lines
      doc.line(startX, startY, startX, startY + headerHeight + totalGridHeight);
      doc.line(startX + timeColWidth, startY, startX + timeColWidth, startY + headerHeight + totalGridHeight);
      for (let i = 1; i <= 5; i++) {
        const x = startX + timeColWidth + i * dayColWidth;
        doc.line(x, startY, x, startY + headerHeight + totalGridHeight);
      }
      doc.line(startX + usableWidth, startY, startX + usableWidth, startY + headerHeight + totalGridHeight);

      // Horizontal lines and time labels
      for (let i = 0; i < maxHour - minHour; i++) {
        const y = startY + headerHeight + i * hourHeight;
        const hour = minHour + i;
        doc.text(`${hour.toString().padStart(2, '0')}:00`, startX + timeColWidth - 2, y + 4, { align: 'right' });
        doc.line(startX, y, startX + usableWidth, y);
      }
      doc.line(startX, startY + headerHeight + totalGridHeight, startX + usableWidth, startY + headerHeight + totalGridHeight);

      // Draw Classes
      regularSessions.forEach(session => {
        if (!session.day || !session.startTime || !session.endTime) return;
        const dayIndex = DAYS.indexOf(session.day);
        if (dayIndex === -1) return;

        const [startH, startM] = session.startTime.split(':').map(Number);
        const [endH, endM] = session.endTime.split(':').map(Number);
        const startOffsetMins = (startH - minHour) * 60 + startM;
        const durationMins = endH * 60 + endM - (startH * 60 + startM);

        const cellX = startX + timeColWidth + dayIndex * dayColWidth;
        const cellY = startY + headerHeight + (startOffsetMins / 60) * hourHeight;
        const cellHeight = (durationMins / 60) * hourHeight;

        let { r, g, b } = hexToRgb(session.color || '#22C55E');
        if (session.conflict) { r = 255; g = 0; b = 110; }

        // Draw cell based on theme
        if (theme === 'MINIMALIST') {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD');
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 2, cellHeight - 1, 'F');
          doc.setTextColor(0, 0, 0);
        } else if (theme === 'NEON') {
          doc.setFillColor(21, 27, 59);
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(0.5);
          doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD');
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 1.5, cellHeight - 1, 'F');
          doc.setTextColor(224, 231, 255);
        } else if (theme === 'SCHOOL') {
          doc.setFillColor(r, g, b);
          doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 2, 2, 'F');
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          doc.setTextColor(luminance > 0.5 ? 0 : 255, luminance > 0.5 ? 0 : 255, luminance > 0.5 ? 0 : 255);
        } else {
          doc.setFillColor(r, g, b);
          doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 1, 1, 'F');
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          doc.setTextColor(luminance > 0.5 ? 0 : 255, luminance > 0.5 ? 0 : 255, luminance > 0.5 ? 0 : 255);
        }

        // Text content - IMPROVED FONT SIZES
        const titleFontSize = 9 * fontScale * exportScale;
        doc.setFontSize(titleFontSize);
        doc.setFont(style.font, 'bold');

        const textX = cellX + 2.5;
        let textY = cellY + 4;
        const maxTextWidth = dayColWidth - 5;

        // Subject name with word wrap
        const subjectLines = doc.splitTextToSize(session.subject, maxTextWidth);
        const maxSubjectLines = Math.min(subjectLines.length, 2);
        doc.text(subjectLines.slice(0, maxSubjectLines), textX, textY);
        textY += maxSubjectLines * (titleFontSize * 0.4) + 1;

        // Details
        const detailsFontSize = 7.5 * fontScale * exportScale;
        doc.setFont(style.font, 'normal');
        doc.setFontSize(detailsFontSize);

        // Time
        if (textY < cellY + cellHeight - 3) {
          doc.text(`${session.startTime} - ${session.endTime}`, textX, textY);
          textY += detailsFontSize * 0.4 + 1;
        }

        // Teacher (truncated if needed)
        if (session.teacher && textY < cellY + cellHeight - 3) {
          const teacherText = session.teacher.length > 25 ? session.teacher.substring(0, 22) + '...' : session.teacher;
          doc.text(teacherText, textX, textY);
          textY += detailsFontSize * 0.4 + 1;
        }

        // Location
        if (session.location && textY < cellY + cellHeight - 2) {
          const locationText = session.location.length > 20 ? session.location.substring(0, 17) + '...' : session.location;
          doc.text(locationText, textX, textY);
        }
      });

      // Virtual sessions section
      if (virtualSessions.length > 0) {
        const sectionStartY = startY + headerHeight + totalGridHeight + 10;
        doc.setFont(style.font, 'bold');
        doc.setFontSize(11 * fontScale * exportScale);
        doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
        doc.text('Materias Virtuales / Asincronicas', startX, sectionStartY);

        const virtualGap = 4;
        const virtualCardWidth = (usableWidth - virtualGap * (virtualColumns - 1)) / virtualColumns;
        const virtualCardTop = sectionStartY + 6;

        virtualSessions.forEach((session, index) => {
          const column = index % virtualColumns;
          const row = Math.floor(index / virtualColumns);
          const cardX = startX + column * (virtualCardWidth + virtualGap);
          const cardY = virtualCardTop + row * (virtualCardHeight + 4);
          if (cardY + virtualCardHeight > pageHeight - 10) return;

          const { r, g, b } = hexToRgb(session.color || '#a1f5b8');
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(0.4);
          doc.roundedRect(cardX, cardY, virtualCardWidth, virtualCardHeight, 2, 2, 'FD');
          doc.setFillColor(r, g, b);
          doc.rect(cardX, cardY, 2, virtualCardHeight, 'F');

          doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
          doc.setFont(style.font, 'bold');
          doc.setFontSize(8.5 * fontScale * exportScale);
          const subjectLines = doc.splitTextToSize(session.subject, virtualCardWidth - 6);
          doc.text(subjectLines, cardX + 3, cardY + 3.8);

          let infoY = cardY + 3.8 + subjectLines.length * 3.2;
          doc.setFont(style.font, 'normal');
          doc.setFontSize(7 * fontScale * exportScale);
          doc.text(`Docente: ${session.teacher || 'N/A'} | ${session.location || 'Virtual'}`, cardX + 3, infoY);
        });
      }

      doc.save('mi_horario_utm.pdf');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('No se pudo generar el PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pt-2 relative z-10">
      {/* Header del horario */}
      <div className="bg-surface-container-lowest rounded-xl editorial-shadow p-4 mb-4 relative z-50">
        <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
          <div className="flex items-start gap-4 w-full lg:w-auto">
            <div className="hidden sm:flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-on-primary shrink-0">
              <GraduationCap size={24} />
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="text-xl md:text-2xl font-bold text-on-surface border-b-2 border-primary outline-none bg-transparent min-w-[200px]"
                      autoFocus
                      onBlur={saveTitle}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                    />
                    <button onClick={saveTitle} className="text-primary hover:text-primary-container">
                      <Check size={20} />
                    </button>
                  </div>
                ) : (
                  <h2
                    className="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2 group cursor-pointer"
                    onClick={startEditingTitle}
                  >
                    {currentSchedule.title}
                    <span className="opacity-0 group-hover:opacity-100 text-on-surface-variant">
                      <PenTool size={14} />
                    </span>
                  </h2>
                )}
              </div>
              <p className="text-on-surface-variant font-medium text-sm mb-2">
                {currentSchedule.faculty || 'TECNOLOGIAS DE LA INFORMACION'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {currentSchedule.academic_period && (
                  <div className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase">
                    <CalIcon size={11} />
                    {currentSchedule.academic_period}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
            {/* Mobile Zoom */}
            <div className="flex md:hidden items-center gap-1 bg-surface-container rounded-lg p-1 mr-2">
              <button
                onClick={() => setFontScale(fontScale - 0.1)}
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-medium w-10 text-center text-on-surface">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                onClick={() => setFontScale(fontScale + 0.1)}
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <button
              onClick={() => setResetModalOpen(true)}
              className="flex-1 lg:flex-none justify-center px-4 py-2 bg-surface-container text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-high flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} /> Nuevo
            </button>
            <button
              onClick={() => setCustomizerOpen(true)}
              className="flex-1 lg:flex-none justify-center px-4 py-2 bg-surface-container text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-high flex items-center gap-2 transition-colors"
            >
              <Palette size={16} /> Personalizar
            </button>

            {/* Export Menu */}
            <div className="relative z-50">
              <button
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className="flex-1 lg:flex-none justify-center px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-bold flex items-center gap-2 shadow-editorial hover:scale-[1.02] transition-transform duration-200"
              >
                <Download size={16} /> Exportar
                <ChevronDown size={14} className={`transition-transform duration-200 ${actionsMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {actionsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActionsMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl editorial-shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setActionsMenuOpen(false);
                        handleDownload();
                      }}
                      disabled={isExporting}
                      className="w-full text-left px-4 py-3 hover:bg-surface-container text-sm text-on-surface font-medium flex items-center gap-3 border-b border-outline-variant/15"
                    >
                      <div className="w-8 h-8 bg-error-container text-error rounded-lg flex items-center justify-center">
                        {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span>Documento PDF</span>
                        <span className="text-[10px] text-on-surface-variant">Descargar Alta Calidad</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setCalendarModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-surface-container text-sm text-on-surface font-medium flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-primary-fixed text-on-primary-fixed-variant rounded-lg flex items-center justify-center">
                        <CalIcon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span>Archivo de Calendario</span>
                        <span className="text-[10px] text-on-surface-variant">Exportar formato .ics</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div id="schedule-export-container" className="p-2 md:p-4 rounded-xl bg-surface-container-low editorial-shadow">
        <div className="flex flex-row gap-4 items-start">
          {/* Desktop Zoom */}
          <div className="hidden md:flex flex-col items-center gap-2 py-3 px-2 rounded-full editorial-shadow bg-surface-container-lowest text-on-surface-variant sticky top-28 z-10">
            <button
              onClick={() => setFontScale(fontScale + 0.1)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary"
            >
              <ZoomIn size={20} />
            </button>
            <div className="h-px w-4 bg-outline-variant" />
            <span className="text-[10px] font-bold select-none text-on-surface">{Math.round(fontScale * 100)}%</span>
            <div className="h-px w-4 bg-outline-variant" />
            <button
              onClick={() => setFontScale(fontScale - 0.1)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary"
            >
              <ZoomOut size={20} />
            </button>
          </div>

          <div className="flex-grow w-full">
            <ScheduleGrid
              schedule={currentSchedule}
              isGuest={!user}
              onResolveConflict={() => {}}
              theme={theme}
              fontScale={fontScale}
            />
          </div>
        </div>
      </div>

      {/* Modals and Sidebars */}
      <ConfirmResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmReset}
      />
      <CustomizerSidebar
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schedule={currentSchedule}
        onColorChange={handleColorChange}
        currentTheme={theme}
        onThemeChange={setTheme}
        onResetColors={() => {
          // Reset colors using the store
          const { resetColors } = useScheduleStore.getState();
          resetColors();
        }}
      />
      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        onConfirm={(s, e) => generateICS(currentSchedule, s, e)}
        schedule={currentSchedule}
      />
    </div>
  );
};
