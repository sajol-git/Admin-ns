import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/HomeClient';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default async function Home() {
  const supabase = await createClient();

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch banners (if table exists, otherwise empty)
  let banners = [];
  try {
    const { data: bannersData } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('status', 'Active');
    if (bannersData) banners = bannersData;
  } catch (error) {
    console.log('hero_banners table might not exist yet');
  }

  // Fetch settings
  const { data: settingsData } = await supabase.from('settings').select('*');
  const settings = (settingsData || []).reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const topBannerText = settings['hero_banner_text'];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Announcement Bar */}
      {topBannerText && (
        <div className="bg-[#8B183A] text-white text-center py-2 px-4 text-[10px] font-bold tracking-[0.2em] uppercase">
          {topBannerText}
        </div>
      )}

      <Header />

      <main className="flex-1">
        <HomeClient 
          initialBanners={banners}
          initialCategories={categories || []}
          initialProducts={products || []}
          settings={settings}
        />
      </main>

      <Footer settings={settings} />
    </div>
  );
}
