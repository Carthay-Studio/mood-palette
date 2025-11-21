
import React, { useRef, useState, DragEvent } from 'react';
import { ImageIcon } from './icons';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  preview?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, preview }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative w-full h-48 flex flex-col items-center justify-center 
        border-2 cursor-pointer transition-all duration-500 ease-carthay overflow-hidden group
        ${isDragging 
          ? 'border-accent bg-bg' 
          : 'border-border bg-bg hover:border-text-muted hover:bg-surface'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {preview ? (
        <>
            <div className="absolute inset-0 z-0">
                <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700 ease-carthay" 
                />
                <div className="absolute inset-0 bg-bg/60 group-hover:bg-bg/40 transition-colors duration-700"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
                 <div className="border-2 border-border bg-bg px-4 py-2 shadow-xl">
                    <span className="block font-mono text-[10px] text-text-primary uppercase tracking-widest">Source Acquired</span>
                 </div>
                 <span className="font-mono text-[10px] text-text-primary/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">Click to Replace</span>
            </div>
        </>
      ) : (
          <div className="flex flex-col items-center justify-center text-text-muted space-y-4 relative z-10">
            <ImageIcon className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-accent' : 'text-text-muted'}`} />
            <div className="text-center">
                <span className="block font-mono text-[10px] uppercase tracking-widest mb-1">Upload Source Material</span>
                <span className="block font-ui font-light text-sm text-text-muted/70">Drag & drop or click to browse</span>
            </div>
          </div>
      )}
    </div>
  );
};

export default ImageUpload;
