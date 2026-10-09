import React, { useEffect, useRef, useState } from 'react';
import type { TextItem } from '../../uploader/utils/pdfText';

const PAGE_W = 792;
const PAGE_H = 612;

interface SguReportPreviewProps {
  items: TextItem[];
  /** width: la página entera cabe a lo ancho. height: llena el alto y se recorta (como verla en un celular). */
  fit?: 'width' | 'height';
}

// El pie del código QR viene partido en fragmentos superpuestos; se reemplaza por el recuadro del QR
const isQrCaption = (item: TextItem) => (item.page ?? 1) === 1 && item.x < 130 && item.y > 170 && item.y < 200;

/**
 * Página 1 del reporte del SGU reconstruida con cada fragmento de texto en su
 * posición original (datos anonimizados). Es el "antes" de la comparación.
 */
export const SguReportPreview: React.FC<SguReportPreviewProps> = ({ items, fit = 'width' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(fit === 'width' ? width / PAGE_W : height / PAGE_H);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  const page = items.filter((i) => (i.page ?? 1) === 1 && !isQrCaption(i));

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#f4f4f1]">
      <div
        aria-hidden
        className="absolute left-0 top-0 origin-top-left bg-white text-[#1f1f1f]"
        style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* Código QR de verificación (solo su recuadro) */}
        <div
          className="absolute grid grid-cols-5 gap-[2px] border border-[#9a9a9a] p-[4px]"
          style={{ left: 62, top: 112, width: 62, height: 62 }}
        >
          {[1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1].map((on, i) => (
            <span key={i} className={on ? 'bg-[#3a3a3a]' : ''} />
          ))}
        </div>
        <span className="absolute leading-none" style={{ left: 62, top: 182, fontSize: 6.5 }}>
          Código de verificación
        </span>

        {/* Marco y reglas de la tabla, como en el reporte impreso */}
        <div className="absolute border border-[#9a9a9a]" style={{ left: 20, top: 225, width: 752, height: 300 }} />
        <div className="absolute border-t border-[#9a9a9a]" style={{ left: 20, top: 255, width: 752 }} />
        {[320, 415, 500].map((y) => (
          <div key={y} className="absolute border-t border-[#d0d0d0]" style={{ left: 20, top: y, width: 752 }} />
        ))}
        {page.map((item, index) => (
          <span
            key={index}
            className="absolute whitespace-nowrap leading-none"
            style={{ left: item.x, top: item.y - 7, fontSize: 7.2 }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SguReportPreview;
