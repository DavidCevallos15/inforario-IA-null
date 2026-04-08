
import React, { useState, useEffect, useMemo } from 'react';
import { parseScheduleFile } from './services/scheduleParser';
import { Schedule, AppView, ClassSession, Feature, DAYS, ScheduleTheme } from './types';
import { LayoutDashboard, Calendar as CalIcon, Download, PenTool, Check, GraduationCap, RefreshCw, Palette, List, ZoomIn, ZoomOut, ChevronDown, FileText, Trash2, Sparkles, MessageCircle } from 'lucide-react';
import { jsPDF } from "jspdf";
import { motion, AnimatePresence, Variants } from "framer-motion";

import Footer from './components/Footer';
import Uploader from './components/Uploader';
import ScheduleGrid from './components/ScheduleGrid';
import ScheduleList from './components/ScheduleList';
import ConfirmResetModal from './components/ConfirmResetModal';
import CustomizerSidebar from './components/CustomizerSidebar';
import ProcessingView from './components/ProcessingView';
import CalendarModal from './components/CalendarModal';
import { generateICS } from './services/icsExport';
import { EvervaultCard } from './components/ui/evervault-card';
import BackgroundDots from './components/BackgroundDots';
import { saveScheduleToDB, getUserSchedules, getScheduleById, deleteSchedule } from './services/supabase';
import './globals.css';

// Feature Card now uses EvervaultCard
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="h-[250px] w-full relative">
       <EvervaultCard text={title} icon={icon}>
          <p className="text-white/70">{description}</p>
       </EvervaultCard>
    </div>
  );
};

// Define cleanUserId function at the top
const cleanUserId = (id: string): string => {
  return id && id.startsWith('TU') ? id.substring(2) : id;
};

function AnimatedHeroTitle() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Académica Inteligente", "Universitaria Simple", "de Horarios Rápida", "Estudiantil Total", "Sin Conflictos"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col gap-2 py-2 md:py-4 items-center justify-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl w-full max-w-5xl tracking-tighter text-center font-extrabold flex flex-col gap-2 md:gap-4 justify-center items-center px-4">
            <span className="text-foreground drop-shadow-md pb-1">Gestión</span>
            <span className="relative flex w-full justify-center overflow-visible text-center h-[1.8em] md:h-[2.2em] items-center">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 whitespace-nowrap pb-2 md:pb-4 text-[0.8em]"
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -50 : 50,
                          opacity: 0,
                        }
                  }
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Device ID for persistence without login
  const [deviceId, setDeviceId] = useState<string>("");
  
  // Saved Schedules State
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [showUploaderInDashboard, setShowUploaderInDashboard] = useState(false);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  
  // Customization State
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [theme, setTheme] = useState<ScheduleTheme>('DEFAULT');
  const [fontScale, setFontScale] = useState(1); // 1 = 100%

  // UI Actions Menu State
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Reset Confirmation State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Initialize Device ID
  useEffect(() => {
    let id = localStorage.getItem('inforario_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('inforario_device_id', id);
    }
    setDeviceId(id);
  }, []);

  // Fetch schedules when deviceId is ready
  const fetchSchedules = async (uid: string) => {
    try {
      const data = await getUserSchedules(uid);
      setSavedSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchSchedules(deviceId);
    }
  }, [deviceId]);

  // Handlers
  const handleFeatureAccess = (feature: Feature) => {
    return true; // All features unlocked
  };

  const handleUpload = async (file: File) => {

    setIsProcessing(true);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const mimeType = file.type;
        try {
          const { sessions, faculty, academic_period } = await parseScheduleFile(base64data, mimeType);
          
          let newSchedule: Schedule = {
            title: "Mi Horario Académico",
            sessions: sessions,
            lastUpdated: new Date(),
            academic_period: academic_period || "SEPTIEMBRE 2025 - ENERO 2026",
            faculty: faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS"
          };
          
          setCurrentSchedule(newSchedule);
          setView(AppView.DASHBOARD);
          setShowUploaderInDashboard(false);
          setFontScale(1); // Reset font scale on new upload
          
          // Auto-save to DB
          if (deviceId) {
            const saved = await saveScheduleToDB(deviceId, newSchedule);
            if (saved && saved[0]) {
              setCurrentSchedule(prev => prev ? { ...prev, id: saved[0].id } : null);
              fetchSchedules(deviceId);
            }
          }
          
        } catch (err: any) {
          alert(err.message || "No se pudo procesar el documento.");
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Error al leer el archivo.");
    }
  };

  const handleConflictResolution = (session: ClassSession) => {
    alert(`Resolviendo conflicto para ${session.subject}.`);
  };

  const startEditingTitle = () => {
    if (handleFeatureAccess(Feature.EDIT_NAME) && currentSchedule) {
      setTempTitle(currentSchedule.title);
      setIsEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (currentSchedule) {
      const updatedSchedule = { ...currentSchedule, title: tempTitle };
      setCurrentSchedule(updatedSchedule);
      
      // Persist change
      if (deviceId && updatedSchedule.id) {
         await saveScheduleToDB(deviceId, updatedSchedule);
         fetchSchedules(deviceId); // Update list
      }
    }
    setIsEditingTitle(false);
  };

  const handleReset = () => {
    setResetModalOpen(true);
  };

  const confirmReset = () => {
    setCurrentSchedule(null);
    setView(AppView.LANDING);
    setIsEditingTitle(false);
    setResetModalOpen(false);
    setTheme('DEFAULT'); // Reset theme
    setFontScale(1);
    setShowUploaderInDashboard(false);
  };

  const handleSaveAndRegister = () => {
    setResetModalOpen(false);
  };

  const handleCustomize = () => {
    if (handleFeatureAccess(Feature.CUSTOMIZE_COLOR)) {
      setCustomizerOpen(true);
    }
  };

  const handleColorChange = async (subject: string, color: string) => {
    if (!currentSchedule) return;
    
    // Update all sessions with this subject name
    const updatedSessions = currentSchedule.sessions.map(s => 
      s.subject === subject ? { ...s, color } : s
    );
    
    const updatedSchedule = { ...currentSchedule, sessions: updatedSessions };
    setCurrentSchedule(updatedSchedule);
    
    // Persist change
    if (deviceId && updatedSchedule.id) {
        await saveScheduleToDB(deviceId, updatedSchedule);
    }
  };

  // Font Size Actions
  const handleZoomIn = () => setFontScale(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setFontScale(prev => Math.max(prev - 0.1, 0.7));

  // Schedule List Actions
  const handleOpenSchedule = async (id: string) => {
    try {
      const fullSchedule = await getScheduleById(id);
      if (fullSchedule && fullSchedule.schedule_data) {
        setCurrentSchedule({
          id: fullSchedule.id,
          title: fullSchedule.title,
          academic_period: fullSchedule.academic_period,
          faculty: fullSchedule.faculty, 
          sessions: fullSchedule.schedule_data,
          lastUpdated: new Date()
        });
        setView(AppView.DASHBOARD);
      }
    } catch (e) {
      console.error(e);
      alert("Error al abrir el horario.");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este horario?")) {
      try {
        await deleteSchedule(id);
        // Optimistic update
        setSavedSchedules(prev => prev.filter(s => s.id !== id));
        if (currentSchedule?.id === id) {
          setCurrentSchedule(null);
          setView(AppView.LANDING);
        }
      } catch (e: any) {
        console.error("Error removing schedule", e);
        alert(e.message || "No se pudo eliminar el horario. Por favor intente de nuevo.");
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`¿Estás seguro de eliminar ${ids.length} horarios seleccionados?`)) {
      try {
        await Promise.all(ids.map(id => deleteSchedule(id)));
        if (deviceId) fetchSchedules(deviceId);
      } catch (e) {
        console.error(e);
        alert("Ocurrió un error al eliminar los horarios.");
      }
    }
  };
  
  const handleBackToSchedules = () => {
    setView(AppView.LANDING);
    setCurrentSchedule(null);
    setShowUploaderInDashboard(false);
    setIsEditingTitle(false);
    setFontScale(1);
  };

  // Helper to convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleDownload = async () => {
    if(!handleFeatureAccess(Feature.DOWNLOAD_PDF) || !currentSchedule) {
      return;
    }

    setIsExporting(true);

    try {
      // Initialize jsPDF Landscape A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // --- Theme Configurations ---
      const themeConfig = {
        DEFAULT: {
          bg: [10, 14, 39], // #0A0E27
          textMain: [224, 231, 255], // #E0E7FF
          textSec: [139, 146, 176], // Muted
          headerFill: [0, 240, 255], // Primary Cyan
          headerText: [10, 14, 39], // Dark Blue
          gridLines: [30, 39, 73], // Muted Dark
          timeText: [0, 240, 255], // Cyan
          font: "helvetica"
        },
        MINIMALIST: {
          bg: [255, 255, 255],
          textMain: [0, 0, 0],
          textSec: [50, 50, 50],
          headerFill: [255, 255, 255], // White
          headerText: [0, 0, 0], // Black text
          headerBorder: true,
          gridLines: [200, 200, 200], 
          timeText: [0, 0, 0],
          font: "times"
        },
        SCHOOL: {
          bg: [255, 253, 240], // Cream
          textMain: [67, 20, 7], // Dark Orange/Brown
          textSec: [124, 45, 18],
          headerFill: [255, 237, 213], // Orange 100
          headerText: [154, 52, 18], // Orange 800
          gridLines: [253, 186, 116], // Orange 300
          timeText: [194, 65, 12],
          font: "courier"
        },
        NEON: {
          bg: [15, 23, 42], // Slate 900
          textMain: [34, 211, 238], // Cyan 400
          textSec: [165, 243, 252],
          headerFill: [2, 6, 23], // Slate 950
          headerText: [34, 211, 238],
          gridLines: [22, 78, 99], // Cyan 900
          timeText: [8, 145, 178], // Cyan 600
          font: "courier"
        }
      };

      const style = themeConfig[theme === 'DEFAULT' ? 'DEFAULT' : theme];

      // Set Page Background
      doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      doc.rect(0, 0, 297, 210, 'F');

      // --- 1. Header Section ---
      const centerX = 148.5; // A4 Width 297mm / 2
      
      doc.setFont(style.font, "bold");
      doc.setFontSize(18 * fontScale); 
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]); 
      doc.text("UNIVERSIDAD TÉCNICA DE MANABÍ", centerX, 15, { align: "center" });
      
      doc.setFont(style.font, "normal");
      doc.setFontSize(12 * fontScale);
      doc.setTextColor(style.textSec[0], style.textSec[1], style.textSec[2]);
      
      const facultyName = currentSchedule.faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS";
      doc.text(facultyName, centerX, 22, { align: "center" });

      doc.setFontSize(10 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      const studentName = "INVITADO";
      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      const academicPeriod = currentSchedule.academic_period || "SEPTIEMBRE 2025 - ENERO 2026";
      
      doc.text(`Estudiante: ${studentName}`, 15, 32);
      doc.text(`Período: ${academicPeriod}`, centerX, 32, { align: "center" });
      doc.text(`Generado: ${dateStr}`, 282, 32, { align: "right" });

      // --- 2. Grid Configuration ---
      const startX = 15;
      const startY = 40;
      const margin = 15;
      const usableWidth = 297 - (margin * 2);
      
      const timeColWidth = 20;
      const dayColWidth = (usableWidth - timeColWidth) / 5; // 5 Days
      
      let minHour = 7;
      let maxHour = 18;
      if (currentSchedule.sessions.length > 0) {
        let min = 24;
        let max = 0;
        currentSchedule.sessions.forEach(s => {
          const startH = parseInt(s.startTime.split(':')[0]);
          const endH = parseInt(s.endTime.split(':')[0]) + (s.endTime.includes(':30') ? 1 : 0);
          if (startH < min) min = startH;
          if (endH > max) max = endH;
        });
        minHour = Math.max(6, min);
        maxHour = Math.max(minHour + 4, max + 1);
      }
      
      const hourHeight = Math.min(15 * fontScale, 20); 
      const totalGridHeight = (maxHour - minHour) * hourHeight;
      const headerHeight = 10;

      // --- 3. Draw Table Headers ---
      doc.setFillColor(style.headerFill[0], style.headerFill[1], style.headerFill[2]);
      doc.rect(startX, startY, usableWidth, headerHeight, 'F');
      if (theme === 'MINIMALIST') {
        doc.setDrawColor(0,0,0);
        doc.rect(startX, startY, usableWidth, headerHeight, 'S');
      }
      
      doc.setTextColor(style.headerText[0], style.headerText[1], style.headerText[2]);
      doc.setFontSize(10 * fontScale);
      doc.setFont(style.font, "bold");
      
      doc.text("Hora", startX + (timeColWidth/2), startY + 6.5, { align: "center" });
      
      const daysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      daysEs.forEach((day, index) => {
        const xPos = startX + timeColWidth + (index * dayColWidth) + (dayColWidth/2);
        doc.text(day, xPos, startY + 6.5, { align: "center" });
      });

      // --- 4. Draw Grid Lines & Time Labels ---
      doc.setTextColor(style.timeText[0], style.timeText[1], style.timeText[2]);
      doc.setFontSize(8 * fontScale);
      doc.setFont(style.font, "normal");
      
      doc.setDrawColor(style.gridLines[0], style.gridLines[1], style.gridLines[2]);
      doc.line(startX, startY, startX, startY + headerHeight + totalGridHeight);
      doc.line(startX + timeColWidth, startY, startX + timeColWidth, startY + headerHeight + totalGridHeight);
      
      for(let i=1; i<=5; i++) {
        const x = startX + timeColWidth + (i * dayColWidth);
        doc.line(x, startY, x, startY + headerHeight + totalGridHeight);
      }
      doc.line(startX + usableWidth, startY, startX + usableWidth, startY + headerHeight + totalGridHeight);


      for (let i = 0; i < (maxHour - minHour); i++) {
        const y = startY + headerHeight + (i * hourHeight);
        const hour = minHour + i;
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        
        doc.text(timeStr, startX + timeColWidth - 2, y + 4, { align: "right" });
        doc.line(startX, y, startX + usableWidth, y);
      }
      doc.line(startX, startY + headerHeight + totalGridHeight, startX + usableWidth, startY + headerHeight + totalGridHeight);


      // --- 5. Draw Classes ---
      currentSchedule.sessions.forEach(session => {
        const dayIndex = DAYS.indexOf(session.day);
        if (dayIndex === -1) return; 

        const [startH, startM] = session.startTime.split(':').map(Number);
        const [endH, endM] = session.endTime.split(':').map(Number);

        const startOffsetMins = ((startH - minHour) * 60) + startM;
        const durationMins = ((endH * 60) + endM) - ((startH * 60) + startM);
        
        const cellX = startX + timeColWidth + (dayIndex * dayColWidth);
        const cellY = startY + headerHeight + ((startOffsetMins / 60) * hourHeight);
        const cellHeight = (durationMins / 60) * hourHeight;
        
        let { r, g, b } = hexToRgb(session.color || '#00F0FF');
        if (session.conflict) { r=255; g=0; b=110; }

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
        } else if (theme === 'SCHOOL') {
           doc.setFillColor(r, g, b);
           doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 2, 2, 'F');
           doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(r, g, b);
          doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
        }

        const titleFontSize = 10 * fontScale;
        doc.setFontSize(titleFontSize);
        doc.setFont(style.font, "bold");
        
        const textX = cellX + 3;
        let textY = cellY + 3.5;
        
        const subjectLines = doc.splitTextToSize(session.subject, dayColWidth - 5);
        doc.text(subjectLines, textX, textY);
        
        textY += (subjectLines.length * (titleFontSize / 2)) + 0.5;
        
        const detailsFontSize = 8 * fontScale;
        doc.setFont(style.font, "normal");
        doc.setFontSize(detailsFontSize);
        
        if (session.subject_faculty) {
          doc.setFont(style.font, "italic");
          doc.setFontSize(detailsFontSize - 1);
          const facultyText = session.subject_faculty.length > 30 ? session.subject_faculty.substring(0, 27) + '...' : session.subject_faculty;
          doc.text(facultyText, textX, textY);
          textY += (detailsFontSize / 2) + 0.5;
          doc.setFont(style.font, "normal");
          doc.setFontSize(detailsFontSize);
        }

        doc.text(`${session.startTime} - ${session.endTime}`, textX, textY);
        textY += (detailsFontSize / 2) + 0.5;
        
        if (session.teacher) {
          doc.text(session.teacher, textX, textY);
          textY += (detailsFontSize / 2) + 0.5;
        }
        
        if (session.location) {
           doc.text(session.location, textX, textY);
        }
      });

      doc.save('mi_horario_utm.pdf');

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const Content = () => (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground relative z-10 pt-20">
      <nav className="fixed top-0 left-0 z-50 w-full bg-background/40 backdrop-blur-md border-b border-white/10 h-20 shadow-lg">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.LANDING)}>
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-blue-500 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Inforario</span>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all text-primary"
            >
              <MessageCircle size={16} className="hidden sm:block" />
              <span className="hidden sm:block">Comparte tu Experiencia</span>
              <span className="sm:hidden">Feedback</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-2 md:py-4">
        
        {view === AppView.LANDING && (
          <div className="flex flex-col items-center pt-2 pb-6 w-full max-w-6xl mx-auto relative z-10">
            <>
              <motion.div
                custom={0}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatedHeroTitle />
              </motion.div>
              
              <motion.p 
                custom={1}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="text-base md:text-lg text-muted-foreground text-center max-w-2xl mb-4 font-medium"
              >
                Carga tu horario universitario (PDF/Imagen) y transfórmalo en una agenda digital editable. Personalízalo a tu gusto y descárgalo en PDF.
              </motion.p>
              
              <motion.div
                 custom={2}
                 variants={fadeUpVariants}
                 initial="hidden"
                 animate="visible"
                 className="w-full"
              >
                <Uploader onUpload={handleUpload} isProcessing={isProcessing} />
              </motion.div>

              {savedSchedules.length > 0 && (
                <motion.div
                  custom={2.5}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full mt-12"
                >
                  <ScheduleList 
                    schedules={savedSchedules}
                    onOpen={handleOpenSchedule}
                    onDelete={handleDeleteSchedule}
                    onBulkDelete={handleBulkDelete}
                    onLogout={() => {}}
                    onCreateNew={() => setShowUploaderInDashboard(true)}
                  />
                </motion.div>
              )}
              
              <motion.div 
                 custom={3}
                 variants={fadeUpVariants}
                 initial="hidden"
                 animate="visible"
                 className="mt-8 md:mt-16 grid md:grid-cols-3 gap-6 text-center max-w-6xl w-full"
              >
                <FeatureCard 
                    icon={<LayoutDashboard size={24} />}
                    title="Extracción Inteligente"
                    description="Convierte instantáneamente tus documentos de matrícula en un horario digital interactivo."
                />
                <FeatureCard 
                    icon={<FileText size={24} />}
                    title="Exportación PDF"
                    description="Descarga tu horario en formato PDF de alta calidad listo para imprimir."
                />
                <FeatureCard 
                    icon={<PenTool size={24} />}
                    title="Personalización"
                    description="Ajusta colores y fuentes para que tu horario se adapte a tu estilo personal."
                />
              </motion.div>
            </>
          </div>
        )}

        {view === AppView.DASHBOARD && currentSchedule && (
          <div className="animate-in fade-in duration-500 pt-2 relative z-10">
            <div className="bg-card/70 backdrop-blur-md rounded-2xl shadow-lg border border-muted p-4 mb-4 relative z-20">
                <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
                  <div className="flex items-start gap-4 w-full lg:w-auto">
                    <div className="hidden sm:flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-primary-foreground shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
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
                                  className="text-xl md:text-2xl font-bold text-foreground border-b-2 border-primary outline-none bg-transparent min-w-[200px]"
                                  autoFocus
                                  onBlur={saveTitle}
                                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                />
                                <button onClick={saveTitle} className="text-green-400 hover:text-green-300">
                                  <Check size={20} />
                                </button>
                              </div>
                            ) : (
                              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 group cursor-pointer" onClick={startEditingTitle}>
                                {currentSchedule.title}
                                <span className="opacity-0 group-hover:opacity-100 text-muted-foreground">
                                  <PenTool size={14} />
                                </span>
                              </h2>
                            )}
                        </div>
                        <p className="text-muted-foreground font-medium text-sm mb-2">
                          {currentSchedule.faculty || "TECNOLOGIAS DE LA INFORMACION"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {currentSchedule.academic_period && (
                            <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1 rounded-lg text-[10px] md:text-xs font-semibold uppercase border border-border">
                              <CalIcon size={12} />
                              {currentSchedule.academic_period}
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
                    <div className="flex md:hidden items-center gap-1 bg-card border border-muted rounded-lg p-1 mr-2 shadow-sm">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="Disminuir letra">
                          <ZoomOut size={16}/>
                        </button>
                        <span className="text-xs font-medium w-10 text-center text-foreground">{Math.round(fontScale * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="Aumentar letra">
                          <ZoomIn size={16}/>
                        </button>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="flex-1 lg:flex-none justify-center px-4 py-2 bg-card border border-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted flex items-center gap-2 transition-colors"
                      title="Limpiar y crear nuevo"
                    >
                        <RefreshCw size={16} />
                        Nuevo
                    </button>
                    <button 
                      onClick={handleCustomize}
                      className="flex-1 lg:flex-none justify-center px-4 py-2 bg-card border border-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                        <Palette size={16} />
                        Personalizar
                    </button>
                    <div className="relative z-50">
                        <button 
                          onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                          className="flex-1 lg:flex-none justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-cyan-300 flex items-center gap-2 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-colors"
                        >
                          <Download size={16} />
                          Exportar
                          <ChevronDown size={14} className={`transition-transform duration-200 ${actionsMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {actionsMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionsMenuOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-2xl border border-primary z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={() => { setActionsMenuOpen(false); handleDownload(); }}
                                disabled={isExporting}
                                className="w-full text-left px-4 py-3 hover:bg-muted text-sm text-foreground font-medium flex items-center gap-3 border-b border-muted/50"
                              >
                                <div className="w-8 h-8 bg-red-900/30 text-destructive rounded-lg flex items-center justify-center">
                                    {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                                </div>
                                <div className="flex flex-col">
                                    <span>Documento PDF</span>
                                    <span className="text-[10px] text-muted-foreground">Descargar Alta Calidad</span>
                                </div>
                              </button>
                              <button 
                                onClick={() => { setActionsMenuOpen(false); setCalendarModalOpen(true); }}
                                className="w-full text-left px-4 py-3 hover:bg-muted text-sm text-foreground font-medium flex items-center gap-3"
                              >
                                <div className="w-8 h-8 bg-blue-900/30 text-primary rounded-lg flex items-center justify-center">
                                    <CalIcon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span>Archivo de Calendario</span>
                                    <span className="text-[10px] text-muted-foreground">Exportar formato seguro (.ics)</span>
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                </div>
            </div>
            <div id="schedule-export-container" className="p-2 md:p-4 rounded-xl transition-all duration-300 bg-card/80 border border-muted/50 backdrop-blur-sm">
                <div className="flex flex-row gap-4 items-start">
                  <div className="hidden md:flex flex-col items-center gap-2 py-3 px-2 rounded-full shadow-lg border transition-colors sticky top-28 z-10 bg-card border-muted text-primary">
                      <button onClick={handleZoomIn} className="p-2 rounded-full transition-colors hover:bg-muted text-primary" title="Aumentar">
                        <ZoomIn size={20} />
                      </button>
                      <div className="h-px w-4 bg-muted"></div>
                      <span className="text-[10px] font-bold select-none text-foreground">{Math.round(fontScale * 100)}%</span>
                      <div className="h-px w-4 bg-muted"></div>
                      <button onClick={handleZoomOut} className="p-2 rounded-full transition-colors hover:bg-muted text-primary" title="Disminuir">
                        <ZoomOut size={20} />
                      </button>
                  </div>
                  <div className="flex-grow w-full">
                      <ScheduleGrid 
                        schedule={currentSchedule} 
                        isGuest={true}
                        onResolveConflict={handleConflictResolution}
                        theme={theme}
                        fontScale={fontScale}
                      />
                  </div>
                </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ConfirmResetModal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} onConfirm={confirmReset} />
      {currentSchedule && (
        <CustomizerSidebar isOpen={customizerOpen} onClose={() => setCustomizerOpen(false)} schedule={currentSchedule} onColorChange={handleColorChange} currentTheme={theme} onThemeChange={setTheme} />
      )}
      {currentSchedule && (
        <CalendarModal 
           isOpen={calendarModalOpen} 
           onClose={() => setCalendarModalOpen(false)} 
           onConfirm={(s, e) => generateICS(currentSchedule, s, e)} 
        />
      )}
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && <ProcessingView />}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <BackgroundDots theme={theme} />
      <div className="relative min-h-screen w-full text-white overflow-hidden selection:bg-indigo-500 selection:text-white">
          <Content />
      </div>
    </>
  );
};

const UserIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default App;
