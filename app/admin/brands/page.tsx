import { createClient } from '@/utils/supabase/server';
import BrandsClient from './BrandsClient';

export default async function BrandsPage() {
  const supabase = await createClient();
  
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  return <BrandsClient initialBrands={brands || []} />;
}
