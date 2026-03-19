'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export default function CloudinaryUpload({
  value,
  onChange,
  onRemove,
  label = "Image"
}: CloudinaryUploadProps) {
  const onUpload = (result: any) => {
    onChange(result.info.secure_url);
  };

  return (
    <div className="space-y-2">
      <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-4">
        {value ? (
          <div className="relative h-40 w-40 border border-line bg-white p-2 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <img
              src={value}
              alt="Upload"
              className="h-full w-full object-contain"
            />
            <button
              onClick={onRemove}
              type="button"
              className="absolute -right-2 -top-2 border border-line bg-red-500 p-1 text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <CldUploadWidget
            onSuccess={onUpload}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{
              maxFiles: 1,
              folder: 'needieshop',
              sources: ['local'],
              clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp'],
              styles: {
                palette: {
                  window: "#FFFFFF",
                  windowBorder: "#141414",
                  tabIcon: "#141414",
                  menuIcons: "#141414",
                  textDark: "#141414",
                  textLight: "#FFFFFF",
                  link: "#141414",
                  action: "#141414",
                  inactiveTabIcon: "#141414",
                  error: "#F44336",
                  inProgress: "#141414",
                  complete: "#141414",
                  sourceBg: "#FFFFFF"
                },
                fonts: {
                  default: null,
                  "'Courier New', Courier, monospace": {
                    url: null,
                    active: true
                  }
                }
              }
            }}
          >
            {({ open }) => {
              const onClick = () => {
                open();
              };

              return (
                <button
                  type="button"
                  onClick={onClick}
                  className="flex h-40 w-40 flex-col items-center justify-center gap-2 border border-dashed border-line bg-line/5 transition-colors hover:bg-line/10"
                >
                  <Upload className="h-6 w-6 opacity-40" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Upload Image
                  </span>
                </button>
              );
            }}
          </CldUploadWidget>
        )}
      </div>
    </div>
  );
}
