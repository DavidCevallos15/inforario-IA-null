import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

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
          className={`relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center min-h-[200px] text-center
            ${dragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50 bg-card'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            onChange={handleChange}
            accept="application/pdf"
          />
          
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-primary">
            <Upload size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-1">Cargar Horario Académico</h3>
          <p className="text-muted-foreground mb-4 max-w-md text-sm">
            Arrastra tu archivo PDF aquí.<br/>
            Extraeremos automáticamente tu horario.
          </p>
          
          <button 
            onClick={() => inputRef.current?.click()}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] text-sm"
          >
            Seleccionar Archivo
          </button>
          
          <div className="mt-3 text-[10px] text-muted-foreground">
            Formato soportado: PDF
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-lg p-5 border border-primary">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary">
                 <FileText size={20} />
               </div>
               <div>
                 <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                 <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
             </div>
             <button 
                onClick={() => setSelectedFile(null)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                disabled={isProcessing}
             >
               <X size={20} />
             </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analizando Documento...
              </>
            ) : (
              "Procesar Horario"
            )}
          </button>
          
          {isProcessing && (
            <p className="text-center text-[10px] text-primary mt-2 animate-pulse">
              Esto puede tardar unos segundos dependiendo de la complejidad.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;