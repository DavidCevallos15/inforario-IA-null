import React from 'react';
import ReactDOM from 'react-dom/client';
// Fuentes servidas desde la app (sin Google Fonts): solo los pesos y el subconjunto latino que se usan
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import { MotionGlobalConfig } from 'framer-motion';
import App from './App';

// Solo en desarrollo: ?static salta las animaciones (capturas y revisiones visuales)
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('static')) {
  MotionGlobalConfig.skipAnimations = true;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
