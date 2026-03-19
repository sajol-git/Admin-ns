import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/HomeClient';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default async function Home() {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [
    { data: products },
    { data: categories },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('created_at', { ascending: false }),
    supabase.from('settings').select('*')
  ]);

  const settings = (settingsData || []).reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header settings={settings} />

      <main className="flex-1">
        <HomeClient 
          initialCategories={categories || []}
          initialProducts={products || []}
          settings={settings}
        />
      </main>

      <Footer settings={settings} />
    </div>
  );
}
