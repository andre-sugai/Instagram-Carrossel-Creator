import React, { useCallback, useEffect, useState, useRef } from 'react';
import { UploadIcon, CheckIcon, LoaderIcon } from './Icons';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (base64: string) => void;
  slideIndex: number | null;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onUpload, slideIndex }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas arquivos de imagem.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onUpload(reader.result);
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  // Handle Paste (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) processFile(blob);
          e.preventDefault(); 
          break; 
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processFile]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Handle Manual Click
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Upload de Imagem</h3>
            <p className="text-sm text-zinc-400">
              {slideIndex !== null ? `Alterando imagem do Slide ${slideIndex + 1}` : 'Selecione uma imagem'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group
            ${isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/5 bg-black/20'
            }
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            accept="image/*" 
            className="hidden" 
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <LoaderIcon className="w-10 h-10 text-primary animate-spin" />
              <span className="text-sm font-medium text-zinc-300">Processando imagem...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <div className={`p-4 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors ${isDragging ? 'bg-primary/20' : ''}`}>
                <UploadIcon className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-zinc-400 group-hover:text-white'}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-1">Clique ou Arraste a imagem</p>
                <p className="text-sm text-zinc-500">
                  Ou pressione <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-300 font-mono mx-1">Ctrl + V</kbd> para colar
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
