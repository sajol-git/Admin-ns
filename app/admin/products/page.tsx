import { createClient } from '@/utils/supabase/server';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
  const supabase = await createClient();
  let products: any[] = [];
  
  try {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    products = data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tighter mb-2">CATALOG_MANAGEMENT</h1>
          <p className="col-header">Inventory and product metadata control</p>
        </div>
      </div>

      <ProductsClient initialProducts={products} />
    </div>
  );
}
