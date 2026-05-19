import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import Footer from './Footer';
import ProcessingView from '../ProcessingView';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

export const MainLayout: React.FC = () => {
  const { isProcessing } = useUIStore();
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <>
      {/* Background decoration */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,73,37,0.04) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="min-h-screen flex flex-col bg-background text-on-surface relative z-10 pt-20">
          <Header />
          
          <main className="flex-grow max-w-7xl mx-auto px-4 py-2 md:py-4 w-full">
            <Outlet />
          </main>
          
          <Footer />
        </div>
      </div>

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isProcessing && <ProcessingView />}
      </AnimatePresence>
    </>
  );
};
