import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Animation state
  hasAnimated: boolean;
  setHasAnimated: (value: boolean) => void;
  
  // Sidebar states
  customizerOpen: boolean;
  setCustomizerOpen: (open: boolean) => void;
  
  // Modal states
  calendarModalOpen: boolean;
  setCalendarModalOpen: (open: boolean) => void;
  resetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
  
  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  isExporting: boolean;
  setIsExporting: (exporting: boolean) => void;
  
  // Menu states
  actionsMenuOpen: boolean;
  setActionsMenuOpen: (open: boolean) => void;
  
  // Title editing
  isEditingTitle: boolean;
  tempTitle: string;
  setIsEditingTitle: (editing: boolean) => void;
  setTempTitle: (title: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Animation - check sessionStorage on init
      hasAnimated: typeof window !== 'undefined' 
        ? sessionStorage.getItem('inforario_has_animated') === 'true'
        : false,
      setHasAnimated: (value) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('inforario_has_animated', value ? 'true' : 'false');
        }
        set({ hasAnimated: value });
      },
      
      // Sidebars
      customizerOpen: false,
      setCustomizerOpen: (open) => set({ customizerOpen: open }),
      
      // Modals
      calendarModalOpen: false,
      setCalendarModalOpen: (open) => set({ calendarModalOpen: open }),
      resetModalOpen: false,
      setResetModalOpen: (open) => set({ resetModalOpen: open }),
      
      // Processing
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      isExporting: false,
      setIsExporting: (exporting) => set({ isExporting: exporting }),
      
      // Menus
      actionsMenuOpen: false,
      setActionsMenuOpen: (open) => set({ actionsMenuOpen: open }),
      
      // Title editing
      isEditingTitle: false,
      tempTitle: '',
      setIsEditingTitle: (editing) => set({ isEditingTitle: editing }),
      setTempTitle: (title) => set({ tempTitle: title }),
    }),
    {
      name: 'inforario-ui',
      partialize: () => ({}), // Don't persist UI state
    }
  )
);
