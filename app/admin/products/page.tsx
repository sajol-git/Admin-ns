import { createClient } from '@/utils/supabase/server';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
  const supabase = await createClient();
  let products: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];
  
  try {
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
      supabase.from('brands').select('*').order('name', { ascending: true })
    ]);

    products = productsRes.data || [];
    categories = categoriesRes.data || [];
    brands = brandsRes.data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Products</h1>
          <p className="text-sm text-gray-500">Manage your product catalog and inventory</p>
        </div>
      </div>

      <ProductsClient 
        initialProducts={products} 
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
