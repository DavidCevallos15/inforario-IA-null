import React, { useState, useEffect } from "react";
import { parseScheduleFile } from "./services/scheduleParser";
import { parseScheduleFileWithEdge } from "./services/scheduleExtractorEdge";
import {
  Schedule,
  AppView,
  ClassSession,
  Feature,
  DAYS,
  ScheduleTheme,
} from "./types";
import {
  LayoutDashboard,
  Calendar as CalIcon,
  Download,
  PenTool,
  Check,
  GraduationCap,
  RefreshCw,
  Palette,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  FileText,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence, Variants } from "framer-motion";

import Footer from "./components/layout/Footer";
import Uploader from "./components/Uploader";
import ScheduleGrid from "./components/ScheduleGrid";
import ScheduleList from "./components/layout/ScheduleList";
import ConfirmResetModal from "./components/modals/ConfirmResetModal";
import CustomizerSidebar from "./components/CustomizerSidebar";
import ProcessingView from "./components/ProcessingView";
import CalendarModal from "./components/modals/CalendarModal";
import AboutPage from "./components/AboutPage";
import LoginPage from "./components/pages/LoginPage";
import ProfilePage from "./components/pages/ProfilePage";
import { generateICS } from "./services/icsExport";
import {
  saveScheduleToDB,
  getUserSchedules,
  getScheduleById,
  deleteSchedule,
  supabase,
  getUserProfile,
} from "./services/supabase";
import { User } from "lucide-react";
import "./globals.css";

// FeatureCard — Academic Curator
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group bg-surface-container-low hover:bg-surface-container rounded-[1.5rem] p-8 transition-all duration-300 editorial-shadow hover:shadow-[0_24px_48px_rgba(0,73,37,0.12)]">
    <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h4 className="text-xl font-bold text-on-surface mb-3">{title}</h4>
    <p className="text-on-surface-variant leading-relaxed">{description}</p>
  </div>
);

// Define cleanUserId function at the top
const cleanUserId = (id: string): string => {
  return id && id.startsWith("TU") ? id.substring(2) : id;
};

// (AnimatedHeroTitle eliminado — reemplazado por hero editorial estático)

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth State
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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
  const [theme, setTheme] = useState<ScheduleTheme>("DEFAULT");
  const [fontScale, setFontScale] = useState(1); // 1 = 100%

  // UI Actions Menu State
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Reset Confirmation State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Initialize Device ID
  useEffect(() => {
    let id = localStorage.getItem("inforario_device_id");
    if (!id) {
      id = "dev-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("inforario_device_id", id);
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
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        setDeviceId(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        // Fallback to local device id
        let id = localStorage.getItem("inforario_device_id");
        if (!id) {
          id = "dev-" + Math.random().toString(36).substring(2, 11);
          localStorage.setItem("inforario_device_id", id);
        }
        setDeviceId(id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        setDeviceId(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        let id =
          localStorage.getItem("inforario_device_id") ||
          "dev-" + Math.random().toString(36).substring(2, 11);
        setDeviceId(id);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    const profile = await getUserProfile(uid);
    if (profile) {
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchSchedules(deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    if (sessionUser && view === AppView.LOGIN) {
      setView(AppView.LANDING);
    }
  }, [sessionUser, view]);

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
          let parsedResult;

          if (mimeType === "application/pdf") {
            try {
              parsedResult = await parseScheduleFileWithEdge(base64data);
            } catch (edgeError) {
              console.warn(
                "La extracción con Edge Function falló, usando parser local.",
                edgeError,
              );
              parsedResult = await parseScheduleFile(base64data, mimeType);
            }
          } else {
            parsedResult = await parseScheduleFile(base64data, mimeType);
          }

          const { sessions, faculty, academic_period } = parsedResult;

          let newSchedule: Schedule = {
            title: "Mi Horario Académico",
            sessions: sessions,
            lastUpdated: new Date(),
            academic_period: academic_period || "SEPTIEMBRE 2025 - ENERO 2026",
            faculty: faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS",
          };

          setCurrentSchedule(newSchedule);
          setView(AppView.DASHBOARD);
          setShowUploaderInDashboard(false);
          setFontScale(1); // Reset font scale on new upload

          // Auto-save to DB
          if (deviceId) {
            const saved = await saveScheduleToDB(deviceId, newSchedule);
            if (saved && saved[0]) {
              setCurrentSchedule((prev) =>
                prev ? { ...prev, id: saved[0].id } : null,
              );
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
    setTheme("DEFAULT"); // Reset theme
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
    const updatedSessions = currentSchedule.sessions.map((s) =>
      s.subject === subject ? { ...s, color } : s,
    );

    const updatedSchedule = { ...currentSchedule, sessions: updatedSessions };
    setCurrentSchedule(updatedSchedule);

    // Persist change
    if (deviceId && updatedSchedule.id) {
      await saveScheduleToDB(deviceId, updatedSchedule);
    }
  };

  // Font Size Actions
  const handleZoomIn = () => setFontScale((prev) => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setFontScale((prev) => Math.max(prev - 0.1, 0.7));

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
          lastUpdated: new Date(),
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
        setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
        if (currentSchedule?.id === id) {
          setCurrentSchedule(null);
          setView(AppView.LANDING);
        }
      } catch (e: any) {
        console.error("Error removing schedule", e);
        alert(
          e.message ||
            "No se pudo eliminar el horario. Por favor intente de nuevo.",
        );
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (
      confirm(`¿Estás seguro de eliminar ${ids.length} horarios seleccionados?`)
    ) {
      try {
        await Promise.all(ids.map((id) => deleteSchedule(id)));
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
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const handleDownload = async () => {
    if (!handleFeatureAccess(Feature.DOWNLOAD_PDF) || !currentSchedule) {
      return;
    }

    setIsExporting(true);

    try {
      // Initialize jsPDF Landscape A4
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // --- Theme Configurations ---
      const themeConfig = {
        DEFAULT: {
          bg: [251, 249, 248],
          textMain: [27, 28, 28],
          textSec: [63, 73, 64],
          headerFill: [0, 73, 37],
          headerText: [255, 255, 255],
          gridLines: [191, 201, 190],
          timeText: [0, 73, 37],
          font: "helvetica",
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
          font: "times",
        },
        SCHOOL: {
          bg: [255, 253, 240], // Cream
          textMain: [67, 20, 7], // Dark Orange/Brown
          textSec: [124, 45, 18],
          headerFill: [255, 237, 213], // Orange 100
          headerText: [154, 52, 18], // Orange 800
          gridLines: [253, 186, 116], // Orange 300
          timeText: [194, 65, 12],
          font: "courier",
        },
        NEON: {
          bg: [15, 23, 42], // Slate 900
          textMain: [34, 211, 238], // Cyan 400
          textSec: [165, 243, 252],
          headerFill: [2, 6, 23], // Slate 950
          headerText: [34, 211, 238],
          gridLines: [22, 78, 99], // Cyan 900
          timeText: [8, 145, 178], // Cyan 600
          font: "courier",
        },
      };

      const style = themeConfig[theme === "DEFAULT" ? "DEFAULT" : theme];

      // Set Page Background
      doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      doc.rect(0, 0, 297, 210, "F");

      // --- 1. Header Section ---
      const centerX = 148.5; // A4 Width 297mm / 2

      doc.setFont(style.font, "bold");
      doc.setFontSize(18 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      doc.text("UNIVERSIDAD TÉCNICA DE MANABÍ", centerX, 15, {
        align: "center",
      });

      doc.setFont(style.font, "normal");
      doc.setFontSize(12 * fontScale);
      doc.setTextColor(style.textSec[0], style.textSec[1], style.textSec[2]);

      const facultyName =
        currentSchedule.faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS";
      doc.text(facultyName, centerX, 22, { align: "center" });

      doc.setFontSize(10 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      const studentName =
        userProfile?.full_name ||
        sessionUser?.user_metadata?.full_name ||
        "ESTUDIANTE INVITADO";
      const dateStr = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const academicPeriod =
        currentSchedule.academic_period || "SEPTIEMBRE 2025 - ENERO 2026";

      doc.text(`Estudiante: ${studentName}`, 15, 32);
      doc.text(`Período: ${academicPeriod}`, centerX, 32, { align: "center" });
      doc.text(`Generado: ${dateStr}`, 282, 32, { align: "right" });

      // --- 2. Grid Configuration ---
      const startX = 15;
      const startY = 40;
      const margin = 15;
      const usableWidth = 297 - margin * 2;

      const regularSessions = currentSchedule.sessions.filter(
        (s) => !s.isVirtual && s.day && s.startTime && s.endTime,
      );
      const virtualSessions = currentSchedule.sessions.filter(
        (s) => s.isVirtual || !s.day || !s.startTime || !s.endTime,
      );

      const timeColWidth = 20;
      const dayColWidth = (usableWidth - timeColWidth) / 5; // 5 Days

      let minHour = 7;
      let maxHour = 18;
      if (regularSessions.length > 0) {
        let min = 24;
        let max = 0;
        regularSessions.forEach((s) => {
          const startH = parseInt(s.startTime.split(":")[0]);
          const endH =
            parseInt(s.endTime.split(":")[0]) +
            (s.endTime.includes(":30") ? 1 : 0);
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
      doc.setFillColor(
        style.headerFill[0],
        style.headerFill[1],
        style.headerFill[2],
      );
      doc.rect(startX, startY, usableWidth, headerHeight, "F");
      if (theme === "MINIMALIST") {
        doc.setDrawColor(0, 0, 0);
        doc.rect(startX, startY, usableWidth, headerHeight, "S");
      }

      doc.setTextColor(
        style.headerText[0],
        style.headerText[1],
        style.headerText[2],
      );
      doc.setFontSize(10 * fontScale);
      doc.setFont(style.font, "bold");

      doc.text("Hora", startX + timeColWidth / 2, startY + 6.5, {
        align: "center",
      });

      const daysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      daysEs.forEach((day, index) => {
        const xPos =
          startX + timeColWidth + index * dayColWidth + dayColWidth / 2;
        doc.text(day, xPos, startY + 6.5, { align: "center" });
      });

      // --- 4. Draw Grid Lines & Time Labels ---
      doc.setTextColor(style.timeText[0], style.timeText[1], style.timeText[2]);
      doc.setFontSize(8 * fontScale);
      doc.setFont(style.font, "normal");

      doc.setDrawColor(
        style.gridLines[0],
        style.gridLines[1],
        style.gridLines[2],
      );
      doc.line(startX, startY, startX, startY + headerHeight + totalGridHeight);
      doc.line(
        startX + timeColWidth,
        startY,
        startX + timeColWidth,
        startY + headerHeight + totalGridHeight,
      );

      for (let i = 1; i <= 5; i++) {
        const x = startX + timeColWidth + i * dayColWidth;
        doc.line(x, startY, x, startY + headerHeight + totalGridHeight);
      }
      doc.line(
        startX + usableWidth,
        startY,
        startX + usableWidth,
        startY + headerHeight + totalGridHeight,
      );

      for (let i = 0; i < maxHour - minHour; i++) {
        const y = startY + headerHeight + i * hourHeight;
        const hour = minHour + i;
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;

        doc.text(timeStr, startX + timeColWidth - 2, y + 4, { align: "right" });
        doc.line(startX, y, startX + usableWidth, y);
      }
      doc.line(
        startX,
        startY + headerHeight + totalGridHeight,
        startX + usableWidth,
        startY + headerHeight + totalGridHeight,
      );

      // --- 5. Draw Classes ---
      regularSessions.forEach((session) => {
        if (!session.day || !session.startTime || !session.endTime) return;
        const dayIndex = DAYS.indexOf(session.day);
        if (dayIndex === -1) return;

        const [startH, startM] = session.startTime.split(":").map(Number);
        const [endH, endM] = session.endTime.split(":").map(Number);

        const startOffsetMins = (startH - minHour) * 60 + startM;
        const durationMins = endH * 60 + endM - (startH * 60 + startM);

        const cellX = startX + timeColWidth + dayIndex * dayColWidth;
        const cellY =
          startY + headerHeight + (startOffsetMins / 60) * hourHeight;
        const cellHeight = (durationMins / 60) * hourHeight;

        let { r, g, b } = hexToRgb(session.color || "#22C55E");
        if (session.conflict) {
          r = 255;
          g = 0;
          b = 110;
        }

        if (theme === "MINIMALIST") {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.rect(
            cellX + 0.5,
            cellY + 0.5,
            dayColWidth - 1,
            cellHeight - 1,
            "FD",
          );
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 2, cellHeight - 1, "F");
          doc.setTextColor(0, 0, 0);
        } else if (theme === "NEON" || theme === "DEFAULT") {
          doc.setFillColor(21, 27, 59);
          doc.setDrawColor(r, g, b);
          doc.setLineWidth(0.5);
          doc.rect(
            cellX + 0.5,
            cellY + 0.5,
            dayColWidth - 1,
            cellHeight - 1,
            "FD",
          );
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 1.5, cellHeight - 1, "F");
          doc.setTextColor(224, 231, 255);
        } else if (theme === "SCHOOL") {
          doc.setFillColor(r, g, b);
          doc.roundedRect(
            cellX + 0.5,
            cellY + 0.5,
            dayColWidth - 1,
            cellHeight - 1,
            2,
            2,
            "F",
          );
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(r, g, b);
          doc.roundedRect(
            cellX + 0.5,
            cellY + 0.5,
            dayColWidth - 1,
            cellHeight - 1,
            1,
            1,
            "F",
          );
          doc.setTextColor(255, 255, 255);
        }

        const titleFontSize = 10 * fontScale;
        doc.setFontSize(titleFontSize);
        doc.setFont(style.font, "bold");

        const textX = cellX + 3;
        let textY = cellY + 3.5;

        const subjectLines = doc.splitTextToSize(
          session.subject,
          dayColWidth - 5,
        );
        doc.text(subjectLines, textX, textY);

        textY += subjectLines.length * (titleFontSize / 2) + 0.5;

        const detailsFontSize = 8 * fontScale;
        doc.setFont(style.font, "normal");
        doc.setFontSize(detailsFontSize);

        if (session.subject_faculty) {
          doc.setFont(style.font, "italic");
          doc.setFontSize(detailsFontSize - 1);
          const facultyText =
            session.subject_faculty.length > 30
              ? session.subject_faculty.substring(0, 27) + "..."
              : session.subject_faculty;
          doc.text(facultyText, textX, textY);
          textY += detailsFontSize / 2 + 0.5;
          doc.setFont(style.font, "normal");
          doc.setFontSize(detailsFontSize);
        }

        doc.text(`${session.startTime} - ${session.endTime}`, textX, textY);
        textY += detailsFontSize / 2 + 0.5;

        if (session.teacher) {
          doc.text(session.teacher, textX, textY);
          textY += detailsFontSize / 2 + 0.5;
        }

        if (session.location) {
          doc.text(session.location, textX, textY);
        }
      });

      if (virtualSessions.length > 0) {
        const sectionStartY = startY + headerHeight + totalGridHeight + 10;
        doc.setFont(style.font, "bold");
        doc.setFontSize(11 * fontScale);
        doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
        doc.text("Materias Virtuales / Asincrónicas", startX, sectionStartY);

        let virtualY = sectionStartY + 6;
        doc.setFont(style.font, "normal");
        doc.setFontSize(9 * fontScale);

        virtualSessions.forEach((session) => {
          if (virtualY > 200) return;
          doc.text(`- ${session.subject} | Docente: ${session.teacher || "N/A"} | Modalidad: Virtual`, startX, virtualY);
          virtualY += 5;
        });
      }

      doc.save("mi_horario_utm.pdf");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.3 + i * 0.15,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const displayName =
    userProfile?.full_name ||
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.email?.split("@")[0] ||
    "estudiante";

  const Content = () => (
    <div className="min-h-screen flex flex-col bg-background text-on-surface relative z-10 pt-20">
      <nav
        className="fixed top-0 left-0 z-50 w-full h-20"
        style={{
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0,73,37,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView(AppView.LANDING)}
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-on-primary" />
            </div>
            <span className="text-2xl font-extrabold tracking-tighter text-primary">
              Inforario
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <span
              onClick={() => setView(AppView.LANDING)}
              className="text-on-surface-variant font-semibold hover:text-secondary transition-colors duration-300 cursor-pointer text-sm"
            >
              Inicio
            </span>
            <span
              onClick={() => setView(AppView.ABOUT)}
              className="text-on-surface-variant font-semibold hover:text-secondary transition-colors duration-300 cursor-pointer text-sm"
            >
              Acerca de Inforario
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentSchedule && (
              <button
                onClick={() => setView(AppView.DASHBOARD)}
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                Mi Horario
              </button>
            )}

            {sessionUser ? (
              <button
                onClick={() => setView(AppView.PROFILE)}
                className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <User size={16} />
                <span className="hidden sm:block">
                  {userProfile?.full_name?.split(" ")[0] || "Perfil"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setView(AppView.LOGIN)}
                className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary/5 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}

            <a
              href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-full font-semibold text-sm hover:bg-primary-container transition-colors duration-200"
            >
              <MessageCircle size={14} className="hidden sm:block" />
              <span className="hidden sm:block">Feedback</span>
              <span className="sm:hidden">FB</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-2 md:py-4 w-full">
        {view === AppView.LOGIN && (
          <LoginPage
            onLogin={() => setView(AppView.LANDING)}
            onBack={() => setView(AppView.LANDING)}
          />
        )}

        {view === AppView.PROFILE && (
          <ProfilePage
            onBack={() => setView(AppView.LANDING)}
            onLogout={() => setView(AppView.LANDING)}
          />
        )}

        {view === AppView.ABOUT && <AboutPage />}

        {view === AppView.LANDING && (
          <div className="flex flex-col items-center pb-16 w-full relative z-10">
            {/* Blob decorativo estático */}
            <div
              className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,73,37,0.04) 0%, transparent 70%)",
              }}
            />

            {sessionUser ? (
              <>
                <motion.div
                  custom={0}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-5xl mx-auto pt-10 px-4"
                >
                  <div className="bg-surface-container-lowest rounded-[1.8rem] p-6 md:p-8 editorial-shadow border border-outline-variant/20">
                    <span className="label-md text-secondary block mb-3">
                      GESTOR DE HORARIOS
                    </span>
                    <h1 className="headline-md text-on-surface mb-2">
                      Bienvenido,{" "}
                      <span className="text-primary">{displayName}</span>
                    </h1>
                    <p className="body-lg text-on-surface-variant mb-6">
                      Aquí puedes ver tus horarios guardados, crear uno nuevo y
                      exportarlos cuando lo necesites.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          document
                            .getElementById("uploader-select-btn")
                            ?.click()
                        }
                        className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-container transition-colors"
                      >
                        Crear mi horario
                      </button>
                      <button
                        onClick={() => setView(AppView.ABOUT)}
                        className="bg-surface-container text-on-surface px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-container-high transition-colors"
                      >
                        Ver guía
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  custom={1}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-5xl mt-8 px-4"
                >
                  <h2 className="title-lg text-on-surface mb-4">
                    Tus horarios
                  </h2>

                  {savedSchedules.length > 0 ? (
                    <ScheduleList
                      schedules={savedSchedules}
                      onOpen={handleOpenSchedule}
                      onDelete={handleDeleteSchedule}
                      onBulkDelete={handleBulkDelete}
                      onLogout={() => supabase.auth.signOut()}
                      onCreateNew={() => setShowUploaderInDashboard(true)}
                    />
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 text-center editorial-shadow">
                      <h3 className="text-2xl font-bold text-on-surface mb-2">
                        Crea tu horario
                      </h3>
                      <p className="text-on-surface-variant mb-6">
                        Aún no tienes horarios guardados. Sube tu PDF del SGA
                        para generar tu primer horario.
                      </p>
                    </div>
                  )}
                </motion.div>

                {(showUploaderInDashboard || savedSchedules.length === 0) && (
                  <motion.div
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-2xl mt-8 px-4"
                  >
                    <Uploader
                      onUpload={handleUpload}
                      isProcessing={isProcessing}
                    />
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {/* Hero */}
                <div className="w-full max-w-4xl mx-auto pt-12 pb-10 px-4 text-center">
                  <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <span className="label-md text-secondary block mb-6">
                      GESTIÓN ACADÉMICA UTM
                    </span>
                  </motion.div>
                  <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="display-lg text-on-surface mb-4 max-w-3xl mx-auto"
                  >
                    Transforma tu horario SGA en una{" "}
                    <span className="italic text-primary">
                      agenda digital impecable.
                    </span>
                  </motion.h1>
                  <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="body-lg text-on-surface-variant max-w-xl mx-auto mb-8"
                  >
                    Carga tu PDF del reporte de matrícula UTM y obtén un horario
                    digital interactivo en segundos.
                  </motion.p>
                  <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                  >
                    <button
                      onClick={() =>
                        document.getElementById("uploader-select-btn")?.click()
                      }
                      className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg shadow-editorial hover:scale-105 active:scale-95 transition-transform duration-200"
                    >
                      Cargar mi Horario
                    </button>
                    <button
                      onClick={() => setView(AppView.ABOUT)}
                      className="text-on-surface-variant font-semibold hover:text-primary transition-colors duration-200 flex items-center gap-2"
                    >
                      Ver cómo funciona →
                    </button>
                  </motion.div>
                </div>

                {/* Uploader */}
                <motion.div
                  custom={4}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-2xl px-4"
                >
                  <Uploader
                    onUpload={handleUpload}
                    isProcessing={isProcessing}
                  />
                </motion.div>

                {/* Horarios guardados */}
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
                      onOpen={handleOpenSchedule}
                      onDelete={handleDeleteSchedule}
                      onBulkDelete={handleBulkDelete}
                      onLogout={() => supabase.auth.signOut()}
                      onCreateNew={() => setShowUploaderInDashboard(true)}
                    />
                  </motion.div>
                )}
              </>
            )}

            {/* Feature Cards */}
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
        )}

        {view === AppView.DASHBOARD && currentSchedule && (
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
                            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                          />
                          <button
                            onClick={saveTitle}
                            className="text-primary hover:text-primary-container"
                          >
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
                      {currentSchedule.faculty ||
                        "TECNOLOGÍAS DE LA INFORMACIÓN"}
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
                <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
                  <div className="flex md:hidden items-center gap-1 bg-surface-container rounded-lg p-1 mr-2">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"
                      title="Disminuir letra"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-medium w-10 text-center text-on-surface">
                      {Math.round(fontScale * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"
                      title="Aumentar letra"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex-1 lg:flex-none justify-center px-4 py-2 bg-surface-container text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                    title="Nuevo horario"
                  >
                    <RefreshCw size={16} /> Nuevo
                  </button>
                  <button
                    onClick={handleCustomize}
                    className="flex-1 lg:flex-none justify-center px-4 py-2 bg-surface-container text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                  >
                    <Palette size={16} /> Personalizar
                  </button>
                  <div className="relative z-50">
                    <button
                      onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                      className="flex-1 lg:flex-none justify-center px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-bold flex items-center gap-2 shadow-editorial hover:scale-[1.02] transition-transform duration-200"
                    >
                      <Download size={16} /> Exportar
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${actionsMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {actionsMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionsMenuOpen(false)}
                        />
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
                              {isExporting ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <FileText size={16} />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span>Documento PDF</span>
                              <span className="text-[10px] text-on-surface-variant">
                                Descargar Alta Calidad
                              </span>
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
                              <span className="text-[10px] text-on-surface-variant">
                                Exportar formato seguro (.ics)
                              </span>
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
            <div
              id="schedule-export-container"
              className="p-2 md:p-4 rounded-xl bg-surface-container-low editorial-shadow"
            >
              <div className="flex flex-row gap-4 items-start">
                <div className="hidden md:flex flex-col items-center gap-2 py-3 px-2 rounded-full editorial-shadow bg-surface-container-lowest text-on-surface-variant sticky top-28 z-10">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary"
                    title="Aumentar"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <div className="h-px w-4 bg-outline-variant" />
                  <span className="text-[10px] font-bold select-none text-on-surface">
                    {Math.round(fontScale * 100)}%
                  </span>
                  <div className="h-px w-4 bg-outline-variant" />
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary"
                    title="Disminuir"
                  >
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
      <ConfirmResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmReset}
      />
      {currentSchedule && (
        <CustomizerSidebar
          isOpen={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          schedule={currentSchedule}
          onColorChange={handleColorChange}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}
      {currentSchedule && (
        <CalendarModal
          isOpen={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          onConfirm={(s, e) => generateICS(currentSchedule, s, e)}
          schedule={currentSchedule}
        />
      )}

      {/* Loading Overlay */}
      <AnimatePresence>{isProcessing && <ProcessingView />}</AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Blob decorativo fijo — reemplaza Three.js BackgroundDots */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,73,37,0.04) 0%, transparent 70%)",
        }}
      />
      <div className="relative min-h-screen w-full overflow-hidden">
        <Content />
      </div>
    </>
  );
};

const UserIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default App;
