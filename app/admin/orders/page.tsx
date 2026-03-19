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
          <h1 className="text-3xl font-mono font-bold tracking-tighter mb-2">ORDER_FULFILLMENT</h1>
          <p className="col-header">Pipeline and shipment tracking</p>
        </div>
      </div>

      <OrdersClient initialOrders={orders} products={products} profiles={profiles} />
    </div>
  );
}
