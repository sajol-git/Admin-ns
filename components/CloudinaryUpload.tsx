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
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-4">
        {value ? (
          <div className="relative h-40 w-40 rounded-xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
            <div className="relative h-full w-full overflow-hidden rounded-lg">
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
              className="absolute -right-2 -top-2 rounded-full border border-gray-200 bg-white p-1.5 text-red-600 shadow-sm hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsLibraryOpen(true)}
              type="button"
              className="absolute -bottom-2 -right-2 rounded-full border border-gray-200 bg-white p-1.5 text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
              title="Change Image"
            >
              <Library className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100 group"
          >
            <Library className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">
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
