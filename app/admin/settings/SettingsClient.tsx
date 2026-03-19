'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  LayoutTemplate, 
  Type, 
  Link as LinkIcon, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Youtube, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Palette,
  Share2,
  Settings2,
  Sparkles,
  Receipt
} from 'lucide-react';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsClientProps {
  initialSettings: Record<string, string>;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const supabase = createClient();

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-12 pb-24"
      >
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
                <Settings2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Store Configuration</h1>
            </div>
            <p className="text-slate-500 font-medium text-left">Customize your storefront&apos;s visual identity, contact details, and social presence.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {saveStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Changes saved
                </motion.div>
              )}
              {saveStatus === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-5 py-2.5 rounded-2xl border border-rose-100 shadow-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  Failed to save
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 text-sm font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Update Settings
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12">
          {/* Homepage Management */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Hero Section</h2>
            </div>
            
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <Sparkles className="h-32 w-32" />
              </div>
              
              <div className="grid grid-cols-1 gap-8 relative z-10">
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Main Headline</label>
                  <div className="relative group">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={settings['hero_title'] || ''}
                      onChange={(e) => handleChange('hero_title', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="Everything You Need."
                    />
                  </div>
                </div>
                
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hero Description</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <textarea
                      rows={3}
                      value={settings['hero_subtitle'] || ''}
                      onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold resize-none outline-none"
                      placeholder="Curated products for the modern lifestyle. Quality over quantity."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={settings['hero_button_text'] || ''}
                      onChange={(e) => handleChange('hero_button_text', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CTA Target Link</label>
                    <div className="relative group">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        value={settings['hero_button_link'] || ''}
                        onChange={(e) => handleChange('hero_button_link', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                        placeholder="#products"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <CloudinaryUpload
                    label="Hero Background Image"
                    value={settings['hero_image'] || ''}
                    onChange={(url) => handleChange('hero_image', url)}
                    onRemove={() => handleChange('hero_image', '')}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* General Settings */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <Palette className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Branding & Identity</h2>
            </div>
            
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Store Name</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        value={settings['site_name'] || ''}
                        onChange={(e) => handleChange('site_name', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                        placeholder="NeedieShop"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <CloudinaryUpload
                      label="Store Logo"
                      value={settings['site_logo'] || ''}
                      onChange={(url) => handleChange('site_logo', url)}
                      onRemove={() => handleChange('site_logo', '')}
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Footer Tagline</label>
                    <textarea
                      rows={4}
                      value={settings['footer_description'] || ''}
                      onChange={(e) => handleChange('footer_description', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold resize-none outline-none"
                      placeholder="Curated products for the modern lifestyle."
                    />
                  </div>
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Copyright Statement</label>
                    <div className="relative group">
                      <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        value={settings['footer_content'] || ''}
                        onChange={(e) => handleChange('footer_content', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                        placeholder="© 2026 NeedieShop. All rights reserved."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Contact Channels</h2>
            </div>
            
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="email"
                      value={settings['contact_email'] || ''}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="hello@neediestore.com"
                    />
                  </div>
                </div>
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Support Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={settings['contact_phone'] || ''}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2.5 md:col-span-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={settings['contact_address'] || ''}
                      onChange={(e) => handleChange('contact_address', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="123 Store Street, City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Media */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm">
                <Share2 className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Social Presence</h2>
            </div>
            
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Facebook URL</label>
                  <div className="relative group">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="url"
                      value={settings['social_facebook'] || ''}
                      onChange={(e) => handleChange('social_facebook', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instagram URL</label>
                  <div className="relative group">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="url"
                      value={settings['social_instagram'] || ''}
                      onChange={(e) => handleChange('social_instagram', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">YouTube URL</label>
                  <div className="relative group">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="url"
                      value={settings['social_youtube'] || ''}
                      onChange={(e) => handleChange('social_youtube', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold outline-none"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
