'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Library } from 'lucide-react';
import Image from 'next/image';
import MediaLibrary from './MediaLibrary';

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export default function CloudinaryUpload({ value, onChange, onRemove, label = "Image" }: CloudinaryUploadProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-4">
        {value ? (
          <div className="relative h-40 w-40 border border-line bg-white p-2 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={value}
                alt="Upload"
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={onRemove}
              type="button"
              className="absolute -right-2 -top-2 border border-line bg-red-500 p-1 text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsLibraryOpen(true)}
              type="button"
              className="absolute -bottom-2 -right-2 border border-line bg-ink p-1 text-bg shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-ink/90 transition-colors"
              title="Change Image"
            >
              <Library className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 border border-dashed border-line bg-line/5 transition-colors hover:bg-line/10 group"
          >
            <Library className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
              Media Library
            </span>
          </button>
        )}
      </div>

      <MediaLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}
