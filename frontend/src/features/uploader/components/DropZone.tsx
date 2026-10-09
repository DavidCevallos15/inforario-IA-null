import React, { useRef, useState } from 'react';
import { FileUp, CircleAlert, X } from 'lucide-react';
import { PencilBox } from '../../../components/notebook/PencilBox';
import { MagneticButton } from '../../../components/notebook/MagneticButton';

const MAX_FILE_SIZE_MB = 10;

interface DropZoneProps {
  onUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
  /** hero: el recuadro grande de la portada. compact: para el panel de horarios guardados. */
  variant?: 'hero' | 'compact';
}

/**
 * Recuadro a lápiz para subir el PDF. Al elegir o soltar el archivo se procesa
 * directamente: un paso menos en el celular.
 */
export const DropZone: React.FC<DropZoneProps> = ({ onUpload, isProcessing, variant = 'hero' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isHero = variant === 'hero';

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.type !== 'application/pdf') {
      setErrorMsg('Ese archivo no es un PDF. Sube el reporte "Horario de clases" que descargas del SGU.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`El archivo pesa más de ${MAX_FILE_SIZE_MB} MB. El reporte del SGU suele pesar menos de 1 MB.`);
      return;
    }
    try {
      await onUpload(file);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error && err.message ? err.message : 'No se pudo leer el PDF. Intenta de nuevo.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const openPicker = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <PencilBox inked={dragActive} delay={isHero ? 0.45 : 0.1}>
        <div
          className={`relative flex flex-col items-start gap-4 transition-colors duration-200 ${
            isHero ? 'px-6 py-8 sm:px-10 sm:py-10' : 'px-5 py-6'
          } ${dragActive ? 'bg-primary-fixed/50' : 'bg-transparent'}`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            id="uploader-file-input"
            type="file"
            accept="application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <p className={`ink font-bold leading-tight ${isHero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {dragActive ? 'Suéltalo aquí' : 'Suelta aquí tu PDF del SGU'}
          </p>
          <p className="max-w-[46ch] text-sm leading-6 text-on-surface-variant sm:text-base">
            El reporte <span className="font-bold text-on-surface">Horario de clases</span> que descargas del SGU.
            Se lee aquí mismo, en tu dispositivo.
          </p>

          <MagneticButton
            type="button"
            id="uploader-select-btn"
            onClick={openPicker}
            disabled={isProcessing}
            className={`mt-2 inline-flex items-center gap-2 rounded-md bg-primary font-bold text-on-primary shadow-editorial transition-colors duration-150 hover:bg-primary-container disabled:cursor-wait disabled:opacity-70 ${
              isHero ? 'px-6 py-3.5 text-base' : 'px-5 py-3 text-sm'
            }`}
          >
            <FileUp size={18} strokeWidth={2.25} />
            {isProcessing ? 'Leyendo tu PDF…' : 'Subir mi PDF'}
          </MagneticButton>
        </div>
      </PencilBox>

      {errorMsg && (
        <div role="alert" className="mt-3 flex animate-shake items-start gap-3 rounded bg-error-container px-4 py-3 text-sm text-on-error-container">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-error" />
          <span className="flex-1 leading-6">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="rounded p-1 transition-colors hover:bg-error/10"
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DropZone;
