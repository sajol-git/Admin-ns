'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';

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
      {/* Banner Management */}
      <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-6">
        <h2 className="text-xl font-mono font-bold tracking-tighter mb-6 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          BANNER_MANAGEMENT
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="col-header block">Hero Banner Text</label>
            <input
              type="text"
              value={settings['hero_banner_text'] || ''}
              onChange={(e) => handleChange('hero_banner_text', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="Welcome to NeedieShop!"
            />
          </div>
          
          <div className="space-y-2">
            <label className="col-header block">Offer Banner Text</label>
            <input
              type="text"
              value={settings['offer_banner_text'] || ''}
              onChange={(e) => handleChange('offer_banner_text', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="Free shipping on orders over $50!"
            />
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-6">
        <h2 className="text-xl font-mono font-bold tracking-tighter mb-6">GENERAL_SETTINGS</h2>
        
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
            <label className="col-header block">Footer Content</label>
            <textarea
              rows={3}
              value={settings['footer_content'] || ''}
              onChange={(e) => handleChange('footer_content', e.target.value)}
              className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink resize-y"
              placeholder="© 2026 NeedieShop. All rights reserved."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
