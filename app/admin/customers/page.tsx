import { createClient } from '@/utils/supabase/server';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const supabase = await createClient();
  
  let profiles: any[] = [];
  let orders: any[] = [];

  try {
    const [profilesRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('customer_phone, total, created_at')
    ]);
    profiles = profilesRes.data || [];
    orders = ordersRes.data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  // Aggregate order data per user (using phone as a proxy for customer identity if no direct relation exists)
  const customerStats = profiles.map(user => {
    const userOrders = orders.filter(o => o.customer_phone === user.phone) || [];
    const totalSpend = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = userOrders.length;
    
    // Sort orders to find the latest one
    const sortedOrders = [...userOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].created_at : null;

    return {
      ...user,
      totalSpend,
      orderCount,
      lastOrderDate
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tighter mb-2">USER_MANAGEMENT</h1>
          <p className="col-header">Customer profiles and role administration</p>
        </div>
      </div>

      <CustomersClient initialCustomers={customerStats} />
    </div>
  );
}
