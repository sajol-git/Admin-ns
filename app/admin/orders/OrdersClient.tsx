'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Order, OrderStatus, Product, User } from '@/types';
import { Search, FileText, MessageSquare, Clock, ChevronRight, ShoppingCart, Plus, X, Loader2 } from 'lucide-react';
import { createOrderWithCustomer } from '@/app/actions/admin';

const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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
    // Real-time updates for orders
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

  const fetchTrackingHistory = async (orderId: string) => {
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
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    fetchTrackingHistory(order.id);
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      
      if (orderError) throw orderError;

      // Add tracking history
      const { error: historyError } = await supabase
        .from('order_tracking_history')
        .insert([{
          order_id: selectedOrder.id,
          status: newStatus,
          message: `Order status updated to ${newStatus}`,
        }]);

      if (historyError) throw historyError;

      // Mock SMS notification
      console.log(`[SMS MOCK] Sending SMS to ${selectedOrder.customer_phone}: Your order #${selectedOrder.id} is now ${newStatus}.`);
      
      fetchTrackingHistory(selectedOrder.id);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

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
    if (!newOrderCustomerName || !newOrderCustomerPhone || !newOrderCustomerAddress || orderItems.length === 0) {
      alert('Please fill in all customer details and add at least one product.');
      return;
    }

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
      alert(result.error);
    } else {
      setIsCreatingOrder(false);
      // Reset form
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
    // In a real app, this would generate a PDF or open a printable view
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              body { font-family: monospace; padding: 40px; }
              h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
              .details { margin-top: 20px; }
              .details p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h1>INVOICE</h1>
            <div class="details">
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Date:</strong> ${new Date(order.created_at || '').toLocaleString()}</p>
              <p><strong>Customer:</strong> ${order.customer_name}</p>
              <p><strong>Phone:</strong> ${order.customer_phone}</p>
              <p><strong>Address:</strong> ${order.customer_address}</p>
              <br/>
              <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
      {/* Order List */}
      <div className="lg:col-span-1 border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full">
        <div className="p-4 border-b border-line flex flex-col gap-4">
          <button 
            onClick={() => setIsCreatingOrder(true)}
            className="flex items-center justify-center gap-2 bg-ink text-bg px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors w-full"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-line bg-transparent pl-10 pr-4 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => handleOrderSelect(order)}
              className={`p-4 border-b border-line cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-ink text-bg' : 'hover:bg-line/5'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono font-bold text-sm truncate pr-2">#{order.id.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${selectedOrder?.id === order.id ? 'border-bg' : 'border-ink'}`}>
                  {order.status}
                </span>
              </div>
              <div className="font-sans text-sm truncate">{order.customer_name}</div>
              <div className="flex justify-between items-center mt-2 opacity-70">
                <span className="font-mono text-xs">${order.total.toFixed(2)}</span>
                <span className="font-mono text-[10px]">{new Date(order.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="lg:col-span-2 border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full overflow-hidden">
        {selectedOrder ? (
          <>
            <div className="p-6 border-b border-line flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-mono font-bold tracking-tighter mb-1">ORDER #{selectedOrder.id.slice(0, 8)}</h2>
                <p className="font-mono text-sm opacity-70">{new Date(selectedOrder.created_at || '').toLocaleString()}</p>
              </div>
              <button 
                onClick={() => generateInvoice(selectedOrder)}
                className="flex items-center gap-2 border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:bg-line/10 transition-colors"
              >
                <FileText className="h-3 w-3" />
                Invoice
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="col-header mb-3">Customer Details</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <p><span className="opacity-50">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="opacity-50">Phone:</span> {selectedOrder.customer_phone}</p>
                    <p><span className="opacity-50">Address:</span> {selectedOrder.customer_address}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="col-header mb-3">Order Summary</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <p className="text-xl font-bold mt-4 pt-4 border-t border-line border-dashed">
                      <span className="opacity-50 text-sm font-normal mr-2">Total:</span> 
                      ${selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="col-header mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(status => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(status)}
                        disabled={isUpdating || selectedOrder.status === status}
                        className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors ${
                          selectedOrder.status === status 
                            ? 'bg-ink text-bg border-ink' 
                            : 'border-line hover:bg-line/10 disabled:opacity-30'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono opacity-50 mt-2 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> SMS notification will be sent automatically.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="col-header mb-4">Tracking History</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-line/20 before:to-transparent">
                  {trackingHistory.length === 0 ? (
                    <p className="font-mono text-sm opacity-50 italic">No tracking history available.</p>
                  ) : (
                    trackingHistory.map((event, i) => (
                      <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-line bg-bg text-ink shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-line/20">
                          <Clock className="h-3 w-3 opacity-50" />
                        </div>
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 border border-line bg-bg shadow-[2px_2px_0px_0px_rgba(20,20,20,0.1)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold uppercase">{event.status}</span>
                            <span className="font-mono text-[10px] opacity-50">{new Date(event.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="font-sans text-sm opacity-80">{event.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <ShoppingCart className="h-12 w-12 opacity-20 mx-auto mb-4" />
              <p className="font-mono opacity-50">Select an order to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col border border-line bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="p-6 border-b border-line flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-mono font-bold tracking-tighter">CREATE_NEW_ORDER</h2>
              <button onClick={() => setIsCreatingOrder(false)} className="p-2 hover:bg-line/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Details Section */}
              <div className="space-y-6">
                <h3 className="col-header border-b border-line pb-2">1. Customer Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs opacity-70 mb-1">Select Existing Customer (Optional)</label>
                    <select 
                      value={selectedCustomerProfile}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                    >
                      <option value="">-- Select Customer --</option>
                      {profiles?.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.phone || 'No phone'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs opacity-70 mb-1">Name *</label>
                      <input 
                        type="text" 
                        value={newOrderCustomerName}
                        onChange={(e) => setNewOrderCustomerName(e.target.value)}
                        className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs opacity-70 mb-1">Phone *</label>
                      <input 
                        type="text" 
                        value={newOrderCustomerPhone}
                        onChange={(e) => setNewOrderCustomerPhone(e.target.value)}
                        className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs opacity-70 mb-1">Delivery Address *</label>
                    <textarea 
                      value={newOrderCustomerAddress}
                      onChange={(e) => setNewOrderCustomerAddress(e.target.value)}
                      className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink min-h-[80px]"
                      required
                    />
                  </div>

                  {!selectedCustomerProfile && (
                    <div className="p-4 border border-line bg-line/5 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={createNewProfile}
                          onChange={(e) => setCreateNewProfile(e.target.checked)}
                          className="accent-ink"
                        />
                        <span className="font-mono text-sm font-bold">Create User Profile for Customer</span>
                      </label>
                      
                      {createNewProfile && (
                        <div>
                          <label className="block font-mono text-xs opacity-70 mb-1">Email Address (Required for profile)</label>
                          <input 
                            type="email" 
                            value={newOrderCustomerEmail}
                            onChange={(e) => setNewOrderCustomerEmail(e.target.value)}
                            className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink bg-bg"
                            placeholder="customer@example.com"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Selection Section */}
              <div className="space-y-6 flex flex-col h-full">
                <h3 className="col-header border-b border-line pb-2">2. Order Items</h3>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border border-line bg-transparent pl-10 pr-4 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                {/* Product Search Results */}
                {productSearch && (
                  <div className="border border-line max-h-40 overflow-y-auto bg-bg shadow-sm">
                    {filteredProducts.length === 0 ? (
                      <div className="p-2 text-center font-mono text-xs opacity-50">No products found</div>
                    ) : (
                      filteredProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-2 border-b border-line last:border-0 hover:bg-line/5">
                          <div className="truncate pr-2">
                            <p className="font-mono text-sm truncate">{product.name}</p>
                            <p className="font-mono text-xs opacity-70">${product.price.toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => handleAddProduct(product)}
                            className="px-2 py-1 bg-ink text-bg font-mono text-xs hover:bg-opacity-90 shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Items */}
                <div className="flex-1 overflow-y-auto border border-line bg-line/5 p-4 min-h-[150px]">
                  {orderItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center font-mono text-sm opacity-50">
                      No items added yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between bg-bg border border-line p-2">
                          <div className="flex-1 truncate pr-2">
                            <p className="font-mono text-sm truncate">{item.product.name}</p>
                            <p className="font-mono text-xs opacity-70">${item.product.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center border border-line">
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="px-2 py-1 hover:bg-line/10"
                              >-</button>
                              <span className="font-mono text-sm px-2 w-8 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="px-2 py-1 hover:bg-line/10"
                              >+</button>
                            </div>
                            <button 
                              onClick={() => handleRemoveProduct(item.product.id)}
                              className="p-1 text-red-500 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-line flex justify-between items-center">
                  <span className="font-mono font-bold">Total Amount:</span>
                  <span className="font-mono text-xl font-bold">
                    ${orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-line flex justify-end gap-4 shrink-0 bg-line/5">
              <button 
                onClick={() => setIsCreatingOrder(false)}
                className="px-6 py-2 font-mono text-sm uppercase tracking-wider border border-line hover:bg-line/10 transition-colors"
                disabled={isSubmittingOrder}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={isSubmittingOrder || orderItems.length === 0 || !newOrderCustomerName || !newOrderCustomerPhone || !newOrderCustomerAddress}
                className="flex items-center gap-2 bg-ink text-bg px-8 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isSubmittingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
