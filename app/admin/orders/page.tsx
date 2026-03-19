import { createClient } from '@/utils/supabase/server';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const supabase = await createClient();
  let orders: any[] = [];
  let products: any[] = [];
  let profiles: any[] = [];
  
  try {
    const [ordersRes, productsRes, profilesRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase.from('profiles').select('*').order('name', { ascending: true })
    ]);
    orders = ordersRes.data || [];
    products = productsRes.data || [];
    profiles = profilesRes.data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Orders</h1>
          <p className="text-sm text-gray-500">Manage orders and fulfillments</p>
        </div>
      </div>

      <OrdersClient initialOrders={orders} products={products} profiles={profiles} />
    </div>
  );
}
