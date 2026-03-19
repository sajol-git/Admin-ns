'use client';

import { useState } from 'react';
import { UploadCloud, Library } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  buttonText?: string;
  className?: string;
  fileName?: string;
}

export function ImageUpload({ onUpload, buttonText = "Upload", className = "" }: ImageUploadProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsLibraryOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 ${className}`}
      >
        <Library className="h-4 w-4" />
        {buttonText}
      </button>

      <MediaLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={onUpload}
      />
    </>
  );
}
