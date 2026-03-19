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
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertCircle, 
  Users, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    { 
      title: 'Total Revenue', 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      change: '+12.5%', 
      isPositive: true,
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    { 
      title: 'Total Orders', 
      value: stats.orderCount.toLocaleString(), 
      change: '+8.2%', 
      isPositive: true,
      icon: ShoppingBag, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    { 
      title: 'Pending Orders', 
      value: stats.pendingOrders.toLocaleString(), 
      change: '-2.4%', 
      isPositive: false,
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    { 
      title: 'Low Stock', 
      value: stats.lowStockProducts.toLocaleString(), 
      change: '+3', 
      isPositive: false,
      icon: AlertCircle, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10 pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Activity className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Analytics Hub</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 font-medium">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Updates</span>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Calendar className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`rounded-2xl ${stat.bg} p-3.5 transition-all group-hover:scale-110 shadow-sm`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider ${
                stat.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                {stat.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{stat.title}</h3>
            <p className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            
            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-[0.03] transition-all group-hover:scale-150 ${stat.bg}`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-[0.1em]">Revenue Performance</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Real-time revenue growth and transaction trends</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
              {['30D', '90D', '1Y'].map((period) => (
                <button 
                  key={period}
                  className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                    period === '30D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 10, fontWeight: 700 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={15}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 10, fontWeight: 700 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value}`}
                  dx={-15}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    color: '#111827', 
                    border: 'none', 
                    borderRadius: '24px', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
                    padding: '20px' 
                  }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 900, fontSize: '16px' }}
                  labelStyle={{ fontWeight: 800, marginBottom: '10px', color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-[0.1em]">Recent Activity</h3>
            <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl transition-all border border-indigo-100">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {activity.map((item, i) => (
                <motion.div 
                  key={item.id || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group flex items-start gap-5 relative"
                >
                  {i !== activity.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-100 group-last:hidden" />
                  )}
                  <div className={`mt-1 rounded-2xl p-3.5 shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3 ${
                    item.type === 'order' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type === 'order' ? <ShoppingBag className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{item.message}</p>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activity.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-gray-50 p-8 mb-6 border border-gray-100">
                  <AlertCircle className="h-12 w-12 text-gray-200" />
                </div>
                <p className="text-lg font-black text-gray-900 uppercase tracking-widest">No recent activity</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">Activity will appear here as it happens.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
