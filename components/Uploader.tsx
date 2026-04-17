import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, ArrowRight } from 'lucide-react';

interface UploaderProps {
  onUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Por favor sube un archivo compatible: PDF del reporte de horarios.");
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          className={`relative rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] text-center cursor-pointer
            ${dragActive
              ? 'bg-primary/5 shadow-[inset_0_0_0_2px_rgba(0,73,37,0.2)]'
              : 'bg-surface-container-low hover:bg-surface-container hover:shadow-editorial'
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
            Arrastra tu archivo PDF del SGA aquí o haz clic para seleccionarlo.<br />
            Extraeremos tu horario automáticamente.
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-sm
              shadow-editorial hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center gap-2"
            id="uploader-select-btn"
          >
            Seleccionar Archivo
            <ArrowRight size={16} />
          </button>

          <div className="mt-4 text-xs text-outline">Formato soportado: PDF</div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-on-primary-fixed-variant">
                <FileText size={22} />
              </div>
              <div>
                <p className="font-semibold text-on-surface text-sm">{selectedFile.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/30"
              disabled={isProcessing}
              aria-label="Quitar archivo seleccionado"
            >
              <X size={18} />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            id="uploader-process-btn"
            className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl
              shadow-editorial hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200
              flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
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
          </button>

          {isProcessing && (
            <p className="text-center text-xs text-on-surface-variant mt-3 animate-pulse">
              Esto puede tardar unos segundos dependiendo del documento.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;