import { createClient } from '@/utils/supabase/server';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const supabase = await createClient();
  let orders: any[] = [];
  
  try {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    orders = data || [];
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

      <OrdersClient initialOrders={orders} />
    </div>
  );
}
