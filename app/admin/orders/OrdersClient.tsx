'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Order, OrderStatus, Product, User } from '@/types';
import { 
  Search, 
  FileText, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  X, 
  Loader2, 
  ShoppingBag, 
  Printer, 
  Users, 
  RefreshCcw, 
  Package, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Trash2, 
  User as UserIcon,
  Filter,
  ArrowUpRight,
  History,
  TrendingUp,
  Receipt,
  Truck,
  Box,
  CreditCard
} from 'lucide-react';
import { createOrderWithCustomer } from '@/app/actions/admin';
import { motion, AnimatePresence } from 'motion/react';

const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const statusConfig = {
  Pending: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  Processing: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' },
  Shipped: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-500' },
  Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  Cancelled: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', dot: 'bg-rose-500' },
};

export default function OrdersClient({ initialOrders, products, profiles }: { initialOrders: Order[], products: Product[], profiles: User[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Create Order Modal State
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [newOrderCustomerName, setNewOrderCustomerName] = useState('');
  const [newOrderCustomerPhone, setNewOrderCustomerPhone] = useState('');
  const [newOrderCustomerAddress, setNewOrderCustomerAddress] = useState('');
  const [newOrderCustomerEmail, setNewOrderCustomerEmail] = useState('');
  const [createNewProfile, setCreateNewProfile] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<string>('');
  
  const [orderItems, setOrderItems] = useState<{product: Product, quantity: number}[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(payload.new as Order);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [supabase, selectedOrder]);

  const fetchTrackingHistory = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_tracking_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTrackingHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch tracking history:', error);
      setTrackingHistory([]);
    }
  }, [supabase]);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    fetchTrackingHistory(order.id);
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      
      if (orderError) throw orderError;

      const { error: historyError } = await supabase
        .from('order_tracking_history')
        .insert([{
          order_id: selectedOrder.id,
          status: newStatus,
          message: `Order status updated to ${newStatus}`,
        }]);

      if (historyError) throw historyError;
      
      fetchTrackingHistory(selectedOrder.id);
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(search.toLowerCase()) || 
      o.customer_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const filteredProducts = useMemo(() => {
    return products?.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];
  }, [products, productSearch]);

  const handleAddProduct = (product: Product) => {
    const existing = orderItems.find(item => item.product.id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems(orderItems.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleCustomerSelect = (profileId: string) => {
    setSelectedCustomerProfile(profileId);
    if (profileId) {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setNewOrderCustomerName(profile.name || '');
        setNewOrderCustomerPhone(profile.phone || '');
        setCreateNewProfile(false);
      }
    } else {
      setNewOrderCustomerName('');
      setNewOrderCustomerPhone('');
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrderCustomerName || !newOrderCustomerPhone || !newOrderCustomerAddress || orderItems.length === 0) return;

    setIsSubmittingOrder(true);
    const total = orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    const result = await createOrderWithCustomer({
      customerName: newOrderCustomerName,
      customerPhone: newOrderCustomerPhone,
      customerAddress: newOrderCustomerAddress,
      customerEmail: newOrderCustomerEmail,
      createNewProfile,
      items: orderItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      total
    });

    setIsSubmittingOrder(false);

    if (result.error) {
      console.error(result.error);
    } else {
      setIsCreatingOrder(false);
      setNewOrderCustomerName('');
      setNewOrderCustomerPhone('');
      setNewOrderCustomerAddress('');
      setNewOrderCustomerEmail('');
      setCreateNewProfile(false);
      setSelectedCustomerProfile('');
      setOrderItems([]);
      setProductSearch('');
    }
  };

  const generateInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 60px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 40px; margin-bottom: 40px; }
              .company-info h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
              .invoice-meta { text-align: right; }
              .invoice-meta h2 { margin: 0; font-size: 24px; color: #6366f1; }
              .details { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 60px; }
              .section-title { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; }
              .info-block p { margin: 6px 0; font-size: 14px; font-weight: 600; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
              th { text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; padding: 15px 0; border-bottom: 2px solid #f1f5f9; }
              td { padding: 20px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; font-weight: 600; }
              .total-section { display: flex; justify-content: flex-end; }
              .total-box { background: #f8fafc; padding: 30px; rounded: 20px; min-width: 250px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .total-row.grand { margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0; }
              .total-amount { font-size: 24px; font-weight: 800; color: #0f172a; }
              @media print { body { padding: 20px; } .total-box { background: #f8fafc !important; -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-info">
                <h1>ADMIN PORTAL</h1>
                <p style="color: #64748b; font-size: 14px; font-weight: 500;">Official Order Invoice</p>
              </div>
              <div class="invoice-meta">
                <h2>#${order.id.slice(0, 8).toUpperCase()}</h2>
                <p style="color: #64748b; font-size: 14px; font-weight: 500;">Date: ${new Date(order.created_at || '').toLocaleDateString()}</p>
              </div>
            </div>
            <div class="details">
              <div class="info-block">
                <div class="section-title">Bill To</div>
                <p>${order.customer_name}</p>
                <p>${order.customer_phone}</p>
                <p>${order.customer_email || 'No email provided'}</p>
              </div>
              <div class="info-block">
                <div class="section-title">Ship To</div>
                <p>${order.customer_address}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Order Items & Processing</td>
                  <td style="text-align: right;">$${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="total-section">
              <div class="total-box">
                <div class="total-row">
                  <span style="color: #64748b;">Subtotal</span>
                  <span>$${order.total.toFixed(2)}</span>
                </div>
                <div class="total-row grand">
                  <span style="font-weight: 800;">Total</span>
                  <span class="total-amount">$${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
                <Box className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Order Management</h1>
            </div>
            <p className="text-slate-500 font-medium text-left">Track, process, and manage customer orders in real-time.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsCreatingOrder(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 text-sm font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-16rem)] min-h-[600px]">
          {/* Order List Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredOrders.length} Orders Found</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="rounded-3xl bg-slate-50 p-6 mb-4 border border-slate-100">
                      <ShoppingCart className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No orders found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Try adjusting your search or create a new order.</p>
                  </motion.div>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.div 
                      key={order.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleOrderSelect(order)}
                      className={`p-5 cursor-pointer rounded-3xl transition-all relative group border ${
                        selectedOrder?.id === order.id 
                          ? 'bg-indigo-50 border-indigo-100 shadow-sm' 
                          : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig[order.status].bg} ${statusConfig[order.status].color} ${statusConfig[order.status].border}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${statusConfig[order.status].dot}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{order.status}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-left">
                        <div className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{order.customer_name}</div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-lg font-bold text-slate-900">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order Details View */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div 
                  key={selectedOrder.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col h-full"
                >
                  {/* Details Header */}
                  <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color} ${statusConfig[selectedOrder.status].border}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusConfig[selectedOrder.status].dot}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{selectedOrder.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 font-medium">
                          <Calendar className="h-4 w-4" />
                          Placed on {new Date(selectedOrder.created_at || '').toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => generateInvoice(selectedOrder)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                      >
                        <Printer className="h-4 w-4" />
                        Invoice
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Customer Info Card */}
                      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                          <Users className="h-32 w-32" />
                        </div>
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Customer Profile</h3>
                        </div>
                        
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-100">
                            {selectedOrder.customer_name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold text-slate-900">{selectedOrder.customer_name}</p>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm font-semibold">{selectedOrder.customer_phone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                          <div className="space-y-1.5 text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" /> Shipping Address
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                              {selectedOrder.customer_address}
                            </p>
                          </div>
                          {selectedOrder.customer_email && (
                            <div className="space-y-1.5 text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" /> Email Address
                              </p>
                              <p className="text-sm text-slate-700 font-semibold">{selectedOrder.customer_email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Control Card */}
                      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                          <RefreshCcw className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Update Status</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(status)}
                              disabled={isUpdating || selectedOrder.status === status}
                              className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                                selectedOrder.status === status
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                                  : 'bg-white text-slate-500 border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 disabled:opacity-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-amber-700 font-bold leading-relaxed text-left">
                            Status updates trigger automated notifications to the customer. Please ensure accuracy before confirming.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Financials */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent pointer-events-none" />
                      <div className="space-y-2 text-center md:text-left relative z-10">
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em]">Financial Summary</p>
                        <h3 className="text-4xl font-bold tracking-tighter">
                          ${selectedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Total value including taxes and shipping</p>
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                          <CreditCard className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Payment Status</p>
                          <p className="text-lg font-bold">Paid via Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Activity Log */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <History className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Activity Log</h3>
                      </div>
                      
                      <div className="relative space-y-6 before:absolute before:inset-0 before:left-[15px] before:h-full before:w-0.5 before:bg-slate-100">
                        {trackingHistory.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-sm text-slate-400 italic font-semibold">No activity recorded yet.</p>
                          </div>
                        ) : (
                          trackingHistory.map((event, idx) => (
                            <div key={event.id} className="relative pl-10 group">
                              <div className={`absolute left-0 top-1.5 h-8 w-8 rounded-xl border-4 border-white flex items-center justify-center shadow-sm z-10 transition-all ${
                                idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <div className={`h-2 w-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-slate-400'}`} />
                              </div>
                              <div className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-left">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-bold uppercase tracking-wider ${idx === 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                                    {event.status}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{event.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 flex items-center justify-center mb-10 border border-slate-100 relative">
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] animate-pulse" />
                      <ShoppingBag className="h-12 w-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Select an Order</h3>
                    <p className="text-sm text-slate-500 max-w-[320px] leading-relaxed font-medium">
                      Choose an order from the directory to manage fulfillment, view customer data, and track delivery history.
                    </p>
                    <div className="mt-10 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                      <ArrowRight className="h-4 w-4 animate-bounce-x" />
                      <span>Pick an order to get started</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create Order Modal */}
        <AnimatePresence>
          {isCreatingOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreatingOrder(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-[3rem] bg-white shadow-2xl overflow-hidden border border-white/20"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                      <Plus className="h-7 w-7" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Order</h2>
                      <p className="text-sm text-slate-500 font-medium">Process a manual order for your customer</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreatingOrder(false)} 
                    className="rounded-2xl p-3 text-slate-400 hover:bg-white hover:text-slate-600 transition-all active:scale-95 shadow-sm"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-16 custom-scrollbar">
                  {/* Step 1: Customer Info */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">01</div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Customer Information</h3>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="space-y-2.5 text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Existing Customer</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <select 
                            value={selectedCustomerProfile}
                            onChange={(e) => handleCustomerSelect(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none font-semibold outline-none"
                          >
                            <option value="">-- New Customer --</option>
                            {profiles?.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.phone || 'No phone'})</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                          <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                              type="text" 
                              value={newOrderCustomerName}
                              onChange={(e) => setNewOrderCustomerName(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-semibold outline-none"
                              placeholder="John Doe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                              type="text" 
                              value={newOrderCustomerPhone}
                              onChange={(e) => setNewOrderCustomerPhone(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-semibold outline-none"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Delivery Address *</label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <textarea 
                            value={newOrderCustomerAddress}
                            onChange={(e) => setNewOrderCustomerAddress(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px] resize-none font-semibold outline-none"
                            placeholder="Enter full shipping address..."
                          />
                        </div>
                      </div>

                      {!selectedCustomerProfile && (
                        <div className="p-6 rounded-[2rem] border border-indigo-100 bg-indigo-50/30 space-y-5">
                          <label className="flex items-center gap-4 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                checked={createNewProfile}
                                onChange={(e) => setCreateNewProfile(e.target.checked)}
                                className="h-6 w-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Create Profile for this Customer</span>
                          </label>
                          
                          <AnimatePresence>
                            {createNewProfile && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2.5 overflow-hidden text-left"
                              >
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                  <input 
                                    type="email" 
                                    value={newOrderCustomerEmail}
                                    onChange={(e) => setNewOrderCustomerEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold outline-none"
                                    placeholder="customer@example.com"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Order Items */}
                  <div className="space-y-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">02</div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Order Items</h3>
                    </div>
                    
                    <div className="space-y-6 flex-1 flex flex-col">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search products to add..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-semibold outline-none"
                        />
                      </div>

                      {/* Product Search Results Dropdown */}
                      <AnimatePresence>
                        {productSearch && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-[2rem] border border-slate-100 max-h-48 overflow-y-auto bg-white shadow-2xl shadow-slate-200/50 z-10 custom-scrollbar"
                          >
                            {filteredProducts.length === 0 ? (
                              <div className="p-8 text-center text-sm text-slate-400 italic font-semibold">No products found</div>
                            ) : (
                              filteredProducts.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                                  <div className="truncate pr-4 text-left">
                                    <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                                    <p className="text-xs text-indigo-600 font-bold mt-0.5">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                  </div>
                                  <button 
                                    onClick={() => handleAddProduct(product)}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                                  >
                                    Add
                                  </button>
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cart Items List */}
                      <div className="flex-1 overflow-y-auto rounded-[2.5rem] border border-slate-100 bg-slate-50/30 p-8 min-h-[320px] space-y-5 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                          {orderItems.length === 0 ? (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30"
                            >
                              <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                                <Package className="h-12 w-12 text-slate-300" />
                              </div>
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cart is empty</p>
                            </motion.div>
                          ) : (
                            <div className="space-y-4">
                              {orderItems.map(item => (
                                <motion.div 
                                  key={item.product.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group"
                                >
                                  <div className="flex-1 truncate pr-6 text-left">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.product.name}</p>
                                    <p className="text-xs text-slate-400 font-bold mt-1">${item.product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / unit</p>
                                  </div>
                                  <div className="flex items-center gap-6 shrink-0">
                                    <div className="flex items-center rounded-xl bg-slate-50 p-1.5 border border-slate-100">
                                      <button 
                                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all font-bold text-lg"
                                      >-</button>
                                      <span className="text-sm font-bold px-4 min-w-[48px] text-center text-slate-900">{item.quantity}</span>
                                      <button 
                                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all font-bold text-lg"
                                      >+</button>
                                    </div>
                                    <button 
                                      onClick={() => handleRemoveProduct(item.product.id)}
                                      className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Total Calculation */}
                      <div className="pt-8 border-t border-slate-100 flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Order Total</span>
                          <span className="text-xs font-bold text-slate-500 mt-1">{orderItems.length} items selected</span>
                        </div>
                        <div className="text-right">
                          <span className="text-4xl font-bold text-slate-900 tracking-tighter">
                            ${orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-end items-center gap-6 shrink-0">
                  <button 
                    onClick={() => setIsCreatingOrder(false)}
                    className="px-8 py-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
                    disabled={isSubmittingOrder}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateOrder}
                    disabled={isSubmittingOrder || orderItems.length === 0 || !newOrderCustomerName || !newOrderCustomerPhone || !newOrderCustomerAddress}
                    className="px-10 py-4 rounded-[1.5rem] bg-slate-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center gap-3"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Finalize Order
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
