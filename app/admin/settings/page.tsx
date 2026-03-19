import { createClient } from '@/utils/supabase/server';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  let settings: any[] = [];
  try {
    const { data } = await supabase.from('settings').select('*');
    settings = data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  // Convert array to object for easier handling
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-500">Manage global settings and content</p>
        </div>
      </div>

      <SettingsClient initialSettings={settingsMap} />
    </div>
  );
}
