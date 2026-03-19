import { createClient } from '@/utils/supabase/server';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  const supabase = await createClient();

  let orders: any[] = [];
  let products: any[] = [];
  let profiles: any[] = [];

  try {
    const [ordersRes, productsRes, profilesRes] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('products').select('*'),
      supabase.from('profiles').select('*')
    ]);
    
    orders = ordersRes.data || [];
    products = productsRes.data || [];
    profiles = profilesRes.data || [];
  } catch (error) {
    console.error('Supabase fetch error:', error);
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const orderCount = orders.length || 0;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length || 0;
  const lowStockProducts = products.filter((p) => p.stock < 10).length || 0;

  // Prepare chart data (mocked for now, ideally group by date)
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const recentActivity = [
    ...(orders?.slice(0, 5).map(o => ({ id: o.id, type: 'order', message: `New order from ${o.customer_name}`, date: o.created_at })) || []),
    ...(profiles?.slice(0, 5).map(u => ({ id: u.id, type: 'user', message: `New user registered: ${u.name}`, date: u.created_at })) || [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Real-time metrics and analytics</p>
      </div>

      <DashboardClient 
        initialStats={{ totalRevenue, orderCount, pendingOrders, lowStockProducts }}
        chartData={chartData}
        recentActivity={recentActivity}
      />
    </div>
  );
}
