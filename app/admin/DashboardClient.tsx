'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DollarSign, ShoppingBag, AlertCircle, Users } from 'lucide-react';

interface DashboardClientProps {
  initialStats: {
    totalRevenue: number;
    orderCount: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  chartData: any[];
  recentActivity: any[];
}

export default function DashboardClient({ initialStats, chartData, recentActivity }: DashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [activity, setActivity] = useState(recentActivity);
  const supabase = createClient();

  useEffect(() => {
    // Real-time subscriptions
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        console.log('Order change received!', payload);
        // In a real app, you'd fetch updated stats or calculate them here
        // For now, we just add a mock activity log
        if (payload.eventType === 'INSERT') {
          setActivity(prev => [{
            id: payload.new.id,
            type: 'order',
            message: `New order from ${payload.new.customer_name}`,
            date: new Date().toISOString()
          }, ...prev].slice(0, 10));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [supabase]);

  const statCards = [
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Total Orders', value: stats.orderCount, icon: ShoppingBag },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: AlertCircle },
    { title: 'Low Stock Alerts', value: stats.lowStockProducts, icon: AlertCircle },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="border border-line bg-bg p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="col-header">{stat.title}</h3>
              <stat.icon className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-3xl font-mono font-bold tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 border border-line bg-bg p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h3 className="col-header mb-6">Revenue Timeline</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--color-ink)" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <YAxis stroke="var(--color-ink)" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-bg)', border: 'none', borderRadius: 0, fontFamily: 'var(--font-mono)' }}
                  itemStyle={{ color: 'var(--color-bg)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-ink)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-ink)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="border border-line bg-bg p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col">
          <h3 className="col-header mb-6">System Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-line/20 pb-3 last:border-0">
                <div className="mt-1">
                  {item.type === 'order' ? <ShoppingBag className="h-4 w-4 opacity-70" /> : <Users className="h-4 w-4 opacity-70" />}
                </div>
                <div>
                  <p className="text-sm font-sans">{item.message}</p>
                  <p className="text-[10px] font-mono opacity-50 mt-1">{new Date(item.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-sm font-mono opacity-50 italic">No recent activity detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
