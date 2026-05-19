import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { Schedule, ScheduleTheme, DAYS } from '../types';
import { generateICS } from '../services/icsExport';

interface UseExportReturn {
  isExporting: boolean;
  exportToPDF: (
    schedule: Schedule,
    theme: ScheduleTheme,
    fontScale: number,
    userName?: string
  ) => Promise<void>;
  exportToICS: (schedule: Schedule, startDate: Date, endDate: Date) => void;
}

// Theme configurations for PDF export
const THEME_CONFIGS = {
  DEFAULT: {
    bg: [251, 249, 248] as const,
    textMain: [27, 28, 28] as const,
    textSec: [63, 73, 64] as const,
    headerFill: [0, 73, 37] as const,
    headerText: [255, 255, 255] as const,
    gridLines: [191, 201, 190] as const,
    timeText: [0, 73, 37] as const,
    font: 'helvetica' as const,
  },
  MINIMALIST: {
    bg: [255, 255, 255] as const,
    textMain: [0, 0, 0] as const,
    textSec: [50, 50, 50] as const,
    headerFill: [255, 255, 255] as const,
    headerText: [0, 0, 0] as const,
    headerBorder: true,
    gridLines: [200, 200, 200] as const,
    timeText: [0, 0, 0] as const,
    font: 'times' as const,
  },
  SCHOOL: {
    bg: [255, 253, 240] as const,
    textMain: [67, 20, 7] as const,
    textSec: [124, 45, 18] as const,
    headerFill: [255, 237, 213] as const,
    headerText: [154, 52, 18] as const,
    gridLines: [253, 186, 116] as const,
    timeText: [194, 65, 12] as const,
    font: 'courier' as const,
  },
  NEON: {
    bg: [15, 23, 42] as const,
    textMain: [34, 211, 238] as const,
    textSec: [165, 243, 252] as const,
    headerFill: [2, 6, 23] as const,
    headerText: [34, 211, 238] as const,
    gridLines: [22, 78, 99] as const,
    timeText: [8, 145, 178] as const,
    font: 'courier' as const,
  },
} as const;

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

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = useCallback(
    async (
      schedule: Schedule,
      theme: ScheduleTheme,
      fontScale: number,
      userName = 'ESTUDIANTE INVITADO'
    ) => {
      setIsExporting(true);

      try {
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a3',
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const style = THEME_CONFIGS[theme];

        // Set Page Background
        doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header Section
        const centerX = pageWidth / 2;

        doc.setFont(style.font, 'bold');
        doc.setFontSize(18 * fontScale);
        doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
        doc.text('UNIVERSIDAD TECNICA DE MANABI', centerX, 15, { align: 'center' });

        doc.setFont(style.font, 'normal');
        doc.setFontSize(12 * fontScale);
        doc.setTextColor(style.textSec[0], style.textSec[1], style.textSec[2]);
        doc.text(schedule.faculty || 'FACULTAD DE CIENCIAS INFORMATICAS', centerX, 22, { align: 'center' });

        doc.setFontSize(10 * fontScale);
        doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
        
        const dateStr = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc.text(`Estudiante: ${userName}`, 15, 32);
        doc.text(`Periodo: ${schedule.academic_period || 'SEPTIEMBRE 2025 - ENERO 2026'}`, centerX, 32, { align: 'center' });
        doc.text(`Generado: ${dateStr}`, pageWidth - 15, 32, { align: 'right' });

        // Grid Configuration
        const startX = 15;
        const startY = 40;
        const margin = 15;
        const usableWidth = pageWidth - margin * 2;

        const regularSessions = schedule.sessions.filter(
          s => !s.isVirtual && s.day && s.startTime && s.endTime
        );
        const virtualSessions = schedule.sessions.filter(
          s => s.isVirtual || !s.day || !s.startTime || !s.endTime
        );

        const timeColWidth = 20;
        const dayColWidth = (usableWidth - timeColWidth) / 5;
        const headerHeight = 10;

        // Calculate time range
        let minHour = 7;
        let maxHour = 18;
        if (regularSessions.length > 0) {
          let min = 24;
          let max = 0;
          regularSessions.forEach(s => {
            const startH = parseInt(s.startTime!.split(':')[0]);
            const endH = parseInt(s.endTime!.split(':')[0]) + (s.endTime!.includes(':30') ? 1 : 0);
            if (startH < min) min = startH;
            if (endH > max) max = endH;
          });
          minHour = Math.max(6, min);
          maxHour = Math.max(minHour + 4, max + 1);
        }

        const baseHourHeight = Math.min(15 * fontScale, 20);
        const virtualColumns = virtualSessions.length >= 5 ? 3 : Math.min(2, Math.max(1, virtualSessions.length));
        const virtualCardHeight = virtualSessions.length > 0 ? 15 : 0;
        const virtualRows = virtualSessions.length > 0 ? Math.ceil(virtualSessions.length / virtualColumns) : 0;
        const virtualSectionHeight = virtualSessions.length > 0
          ? 8 + virtualRows * (virtualCardHeight + 4) + 2
          : 0;

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
        doc.setFontSize(8 * fontScale * exportScale);
        doc.setFont(style.font, 'normal');
        doc.setDrawColor(style.gridLines[0], style.gridLines[1], style.gridLines[2]);

        // Vertical lines
        doc.line(startX, startY, startX, startY + headerHeight + totalGridHeight);
        doc.line(startX + timeColWidth, startY, startX + timeColWidth, startY + headerHeight + totalGridHeight);

        for (let i = 1; i <= 5; i++) {
          const x = startX + timeColWidth + i * dayColWidth;
          doc.line(x, startY, x, startY + headerHeight + totalGridHeight);
        }

        // Horizontal lines and time labels
        for (let i = 0; i < maxHour - minHour; i++) {
          const y = startY + headerHeight + i * hourHeight;
          const hour = minHour + i;
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;

          doc.text(timeStr, startX + timeColWidth - 2, y + 4, { align: 'right' });
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
          if (session.conflict) {
            r = 255; g = 0; b = 110;
          }

          // Draw based on theme
          if (theme === 'MINIMALIST') {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(0, 0, 0);
            doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD');
            doc.setFillColor(r, g, b);
            doc.rect(cellX + 0.5, cellY + 0.5, 2, cellHeight - 1, 'F');
            doc.setTextColor(0, 0, 0);
          } else if (theme === 'NEON' || theme === 'DEFAULT') {
            doc.setFillColor(21, 27, 59);
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(0.5);
            doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD');
            doc.setFillColor(r, g, b);
            doc.rect(cellX + 0.5, cellY + 0.5, 1.5, cellHeight - 1, 'F');
            doc.setTextColor(224, 231, 255);
          } else {
            doc.setFillColor(r, g, b);
            doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
          }

          // Session text
          const titleFontSize = 10 * fontScale * exportScale;
          doc.setFontSize(titleFontSize);
          doc.setFont(style.font, 'bold');

          const textX = cellX + 3;
          let textY = cellY + 3.5;

          const subjectLines = doc.splitTextToSize(session.subject, dayColWidth - 5);
          doc.text(subjectLines, textX, textY);
          textY += subjectLines.length * (titleFontSize * 0.35) + 0.6;

          const detailsFontSize = 8 * fontScale * exportScale;
          doc.setFont(style.font, 'normal');
          doc.setFontSize(detailsFontSize);

          if (session.subject_faculty) {
            doc.setFont(style.font, 'italic');
            doc.setFontSize(detailsFontSize - 1);
            const facultyText = session.subject_faculty.length > 30
              ? session.subject_faculty.substring(0, 27) + '...'
              : session.subject_faculty;
            doc.text(facultyText, textX, textY);
            textY += detailsFontSize * 0.35 + 0.6;
            doc.setFont(style.font, 'normal');
            doc.setFontSize(detailsFontSize);
          }

          doc.text(`${session.startTime} - ${session.endTime}`, textX, textY);
          textY += detailsFontSize * 0.35 + 0.6;

          if (session.teacher) {
            doc.text(session.teacher, textX, textY);
            textY += detailsFontSize * 0.35 + 0.6;
          }

          if (session.location) {
            doc.text(session.location, textX, textY);
          }
        });

        // Draw Virtual Sessions
        if (virtualSessions.length > 0) {
          const sectionStartY = startY + headerHeight + totalGridHeight + 10;
          doc.setFont(style.font, 'bold');
          doc.setFontSize(11 * fontScale * exportScale);
          doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
          doc.text('Materias Virtuales / Asincronicas', startX, sectionStartY);

          const virtualGap = 4;
          const virtualCardWidth = (usableWidth - virtualGap * (virtualColumns - 1)) / virtualColumns;
          const virtualCardTop = sectionStartY + 6;
          const virtualTitleFontSize = 8.5 * fontScale * exportScale;
          const virtualDetailFontSize = 6.8 * fontScale * exportScale;

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
            doc.setFontSize(virtualTitleFontSize);
            const subjectLines = doc.splitTextToSize(session.subject, virtualCardWidth - 6);
            doc.text(subjectLines, cardX + 3, cardY + 3.8);

            let infoY = cardY + 3.8 + subjectLines.length * 3.2;
            doc.setFont(style.font, 'normal');
            doc.setFontSize(virtualDetailFontSize);
            doc.text(
              `Docente: ${session.teacher || 'N/A'} - Modalidad: ${session.location || 'Virtual'}`,
              cardX + 3,
              infoY
            );
          });
        }

        doc.save('mi_horario_utm.pdf');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        throw new Error('No se pudo generar el PDF');
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportToICS = useCallback((schedule: Schedule, startDate: Date, endDate: Date) => {
    generateICS(schedule, startDate, endDate);
  }, []);

  return {
    isExporting,
    exportToPDF,
    exportToICS,
  };
}
