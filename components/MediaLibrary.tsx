'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Upload, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';

interface MediaResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaLibrary({ isOpen, onClose, onSelect }: MediaLibraryProps) {
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      if (data.resources) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
  };

  const confirmSelection = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  const onUpload = (result: any) => {
    if (result.event === 'success') {
      const url = result.info.secure_url;
      onSelect(url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-full max-h-[800px] w-full max-w-5xl flex-col border border-line bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <h2 className="font-mono text-lg font-bold uppercase tracking-tighter">Media Library</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-line/10 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar / Upload Area */}
            <div className="hidden w-48 flex-col border-r border-line bg-line/5 p-4 md:flex">
              <CldUploadWidget
                onSuccess={onUpload}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{
                  maxFiles: 1,
                  folder: 'needieshop',
                  sources: ['local'],
                  clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp'],
                }}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-ink/20 p-4 font-mono text-xs font-bold uppercase hover:border-ink hover:bg-ink hover:text-bg transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload New
                  </button>
                )}
              </CldUploadWidget>
              
              <div className="mt-8 space-y-2">
                <p className="font-mono text-[10px] font-bold uppercase text-ink/40">Folder</p>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  needieshop
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-ink/20" />
                </div>
              ) : resources.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                  <ImageIcon className="mb-4 h-12 w-12" />
                  <p className="font-mono text-sm font-bold uppercase">No media found in library</p>
                  <p className="mt-1 font-mono text-xs">Upload some images to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {resources.map((resource) => (
                    <button
                      key={resource.public_id}
                      onClick={() => handleSelect(resource.secure_url)}
                      className={`group relative aspect-square overflow-hidden border-2 transition-all ${
                        selectedUrl === resource.secure_url 
                          ? 'border-ink ring-2 ring-ink ring-offset-2' 
                          : 'border-line hover:border-ink/40'
                      }`}
                    >
                      <Image
                        src={resource.secure_url}
                        alt={resource.public_id}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {selectedUrl === resource.secure_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                          <div className="rounded-full bg-ink p-1 text-bg">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line bg-line/5 p-4">
            <div className="flex items-center gap-4">
              <CldUploadWidget
                onSuccess={onUpload}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{
                  maxFiles: 1,
                  folder: 'needieshop',
                  sources: ['local'],
                  clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp'],
                }}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className="md:hidden flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-xs font-bold uppercase hover:bg-ink hover:text-bg transition-all"
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                  </button>
                )}
              </CldUploadWidget>
              {selectedUrl && (
                <p className="hidden font-mono text-[10px] font-bold uppercase text-ink/60 md:block">
                  Selected: {selectedUrl.split('/').pop()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="border border-line px-6 py-2 font-mono text-sm font-bold uppercase tracking-wider hover:bg-line/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSelection}
                disabled={!selectedUrl}
                className="bg-ink px-8 py-2 font-mono text-sm font-bold uppercase tracking-wider text-bg hover:bg-ink/90 disabled:opacity-50 transition-colors"
              >
                Insert Image
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
