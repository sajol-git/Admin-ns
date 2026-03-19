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
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-full max-h-[800px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden bg-gray-50/50">
            {/* Sidebar / Upload Area */}
            <div className="hidden w-64 flex-col border-r border-gray-100 bg-white p-6 md:flex">
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-6 text-sm font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <Upload className="h-5 w-5" />
                    Upload New Image
                  </button>
                )}
              </CldUploadWidget>
              
              <div className="mt-8 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Folders</p>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  needieshop
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : resources.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-900">No media found</p>
                  <p className="mt-1 text-sm text-gray-500">Upload some images to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {resources.map((resource) => (
                    <button
                      key={resource.public_id}
                      onClick={() => handleSelect(resource.secure_url)}
                      className={`group relative aspect-square overflow-hidden rounded-xl transition-all ${
                        selectedUrl === resource.secure_url 
                          ? 'ring-2 ring-indigo-600 ring-offset-2' 
                          : 'border border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <Image
                        src={resource.secure_url}
                        alt={resource.public_id}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      {selectedUrl === resource.secure_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20">
                          <div className="rounded-full bg-indigo-600 p-1.5 text-white shadow-sm">
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
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
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
                    className="md:hidden flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                )}
              </CldUploadWidget>
              {selectedUrl && (
                <p className="hidden text-sm text-gray-500 md:block truncate max-w-xs">
                  Selected: <span className="font-medium text-gray-900">{selectedUrl.split('/').pop()}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSelection}
                disabled={!selectedUrl}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
