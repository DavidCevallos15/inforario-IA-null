import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const MAX_FILE_SIZE_MB = 10;

interface DropZoneProps {
  onUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Por favor sube un archivo compatible: PDF del reporte de horarios.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`El archivo supera ${MAX_FILE_SIZE_MB} MB. El reporte del SGU suele pesar menos de 1 MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      try {
        await onUpload(selectedFile);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error && err.message ? err.message : "Error al procesar el archivo");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {errorMsg && (
        <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-xl flex justify-between items-center text-sm shadow-sm animate-shake">
          <span>{errorMsg}</span>
          <button 
            onClick={() => setErrorMsg(null)}
            className="p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!selectedFile ? (
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className={`relative rounded-[2rem] p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] text-center cursor-pointer border-2 border-dashed
            ${dragActive
              ? 'bg-primary/5 border-primary/40 shadow-[0_0_25px_rgba(0,73,37,0.15)]'
              : 'bg-surface-container-low border-outline-variant hover:bg-surface-container hover:shadow-editorial hover:border-primary/20'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Zona para cargar archivo de horario PDF"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept="application/pdf"
            id="uploader-file-input"
          />

          {/* Ícono upload */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300
            ${dragActive ? 'bg-primary-fixed scale-110' : 'bg-surface-container-highest'}`}
          >
            <Upload size={28} className={dragActive ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'} />
          </div>

          <h3 className="text-xl font-bold text-on-surface mb-2">Cargar Horario Académico</h3>
          <p className="text-on-surface-variant mb-6 max-w-sm text-sm leading-relaxed">
            Arrastra tu archivo PDF del SGU aquí o haz clic para seleccionarlo.<br />
            Extraeremos tu horario automáticamente en segundos.
          </p>

          <Button
            type="button"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="shadow-editorial flex items-center gap-2"
            id="uploader-select-btn"
          >
            Seleccionar Archivo
            <ArrowRight size={16} />
          </Button>

          <div className="mt-4 text-xs text-outline">Formato soportado: PDF</div>
        </motion.div>
      ) : (
        <Card className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed rounded-2xl flex items-center justify-center text-on-primary-fixed-variant shadow-sm">
                <FileText size={22} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-on-surface text-sm break-all max-w-[250px] md:max-w-[400px]">{selectedFile.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-xl hover:bg-error-container/30"
              disabled={isProcessing}
              aria-label="Quitar archivo seleccionado"
            >
              <X size={18} />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            isLoading={isProcessing}
            variant="primary"
            id="uploader-process-btn"
            className="w-full flex items-center justify-center gap-2 shadow-editorial py-4 text-sm font-bold"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analizando Documento...
              </>
            ) : (
              <>
                Procesar Horario
                <ArrowRight size={16} />
              </>
            )}
          </Button>

          {isProcessing && (
            <p className="text-center text-xs text-on-surface-variant mt-3 animate-pulse">
              Esto puede tardar unos segundos dependiendo del documento.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
