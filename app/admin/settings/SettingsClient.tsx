'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Loader2, Image as ImageIcon, LayoutTemplate, Type, Link as LinkIcon } from 'lucide-react';
import CloudinaryUpload from '@/components/CloudinaryUpload';

interface SettingsClientProps {
  initialSettings: Record<string, string>;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upsert each setting
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      alert('Settings saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Ensure the "settings" table exists in your Supabase project.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Homepage Management */}
      <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-6">
        <h2 className="text-xl font-mono font-bold tracking-tighter mb-6 flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5" />
          HOMEPAGE_HERO
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="col-header block">Hero Title</label>
            <input
              type="text"
              value={settings['hero_title'] || ''}
              onChange={(e) => handleChange('hero_title', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="Everything You Need."
            />
          </div>
          
          <div className="space-y-2">
            <label className="col-header block">Hero Subtitle</label>
            <textarea
              rows={2}
              value={settings['hero_subtitle'] || ''}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink resize-y"
              placeholder="Curated products for the modern lifestyle. Quality over quantity."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="col-header block">Hero Button Text</label>
              <input
                type="text"
                value={settings['hero_button_text'] || ''}
                onChange={(e) => handleChange('hero_button_text', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="Shop Now"
              />
            </div>
            <div className="space-y-2">
              <label className="col-header block">Hero Button Link</label>
              <input
                type="text"
                value={settings['hero_button_link'] || ''}
                onChange={(e) => handleChange('hero_button_link', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="#products"
              />
            </div>
          </div>

          <div className="space-y-2">
            <CloudinaryUpload
              label="Hero Background Image (Optional)"
              value={settings['hero_image'] || ''}
              onChange={(url) => handleChange('hero_image', url)}
              onRemove={() => handleChange('hero_image', '')}
            />
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-6">
        <h2 className="text-xl font-mono font-bold tracking-tighter mb-6 flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          FOOTER_&_GENERAL
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="col-header block">Shipping Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings['shipping_fee'] || '0'}
              onChange={(e) => handleChange('shipping_fee', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="space-y-2">
            <label className="col-header block">Footer Description</label>
            <textarea
              rows={3}
              value={settings['footer_description'] || ''}
              onChange={(e) => handleChange('footer_description', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink resize-y"
              placeholder="Curated products for the modern lifestyle."
            />
          </div>

          <div className="space-y-2">
            <label className="col-header block">Footer Copyright Text</label>
            <input
              type="text"
              value={settings['footer_content'] || ''}
              onChange={(e) => handleChange('footer_content', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="© 2026 NeedieShop. All rights reserved."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="col-header block">Contact Email</label>
              <input
                type="email"
                value={settings['contact_email'] || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="hello@neediestore.com"
              />
            </div>
            <div className="space-y-2">
              <label className="col-header block">Contact Phone</label>
              <input
                type="text"
                value={settings['contact_phone'] || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="col-header block">Contact Address</label>
              <input
                type="text"
                value={settings['contact_address'] || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="123 Store Street, City, Country"
              />
            </div>
            <div className="space-y-2">
              <label className="col-header block">Facebook Link</label>
              <input
                type="url"
                value={settings['social_facebook'] || ''}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>
            <div className="space-y-2">
              <label className="col-header block">Instagram Link</label>
              <input
                type="url"
                value={settings['social_instagram'] || ''}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>
            <div className="space-y-2">
              <label className="col-header block">YouTube Link</label>
              <input
                type="url"
                value={settings['social_youtube'] || ''}
                onChange={(e) => handleChange('social_youtube', e.target.value)}
                className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-ink text-bg px-8 py-3 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
