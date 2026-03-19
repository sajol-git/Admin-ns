'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, UserRole } from '@/types';
import { 
  Search, 
  Shield, 
  ShieldAlert, 
  User as UserIcon, 
  Loader2, 
  Plus, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  ArrowUpRight,
  UserCheck,
  UserMinus,
  MailCheck
} from 'lucide-react';
import { createCustomerProfile } from '@/app/actions/admin';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerStats extends User {
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string | null;
}

export default function CustomersClient({ initialCustomers }: { initialCustomers: CustomerStats[] }) {
  const [customers, setCustomers] = useState<CustomerStats[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const supabase = createClient();

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.phone || '').includes(search) ||
      (c.id || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  const [editingCustomer, setEditingCustomer] = useState<CustomerStats | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Create Customer State
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Role Change Confirmation State
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string, newRole: UserRole } | null>(null);

  const handleEditClick = (customer: CustomerStats) => {
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    setIsUpdating(editingCustomer.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName, phone: editPhone })
        .eq('id', editingCustomer.id);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, name: editName, phone: editPhone } : c));
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { userId, newRole } = roleChangeTarget;
    
    setIsUpdating(userId);
    setRoleChangeTarget(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === userId ? { ...c, role: newRole } : c));
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerEmail) return;

    setIsSubmittingCustomer(true);
    const result = await createCustomerProfile({
      name: newCustomerName,
      phone: newCustomerPhone,
      email: newCustomerEmail
    });
    setIsSubmittingCustomer(false);

    if (result.error) {
      console.error(result.error);
    } else if (result.user) {
      const newCustomer: CustomerStats = {
        id: result.user.id,
        name: newCustomerName,
        phone: newCustomerPhone,
        role: 'user',
        totalSpend: 0,
        orderCount: 0,
        lastOrderDate: null
      };
      setCustomers([newCustomer, ...customers]);
      setIsCreatingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
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
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Customer Directory</h1>
            </div>
            <p className="text-slate-500 font-medium text-left">Manage your customer base, roles, and monitor engagement metrics.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, phone or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsCreatingCustomer(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 text-sm font-bold rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </header>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: customers.length, icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Revenue', value: `$${customers.reduce((acc, c) => acc + c.totalSpend, 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Orders', value: customers.reduce((acc, c) => acc + c.orderCount, 0), icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Admins', value: customers.filter(c => c.role === 'admin').length, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${stat.bg} rounded-2xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-24 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]"
              >
                <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 border border-slate-100">
                  <UserMinus className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No customers found</h3>
                <p className="text-slate-500 max-w-xs text-center mt-2 font-medium">
                  We couldn&apos;t find any customers matching your search criteria.
                </p>
                <button 
                  onClick={() => setSearch('')}
                  className="mt-8 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                >
                  Clear search filters
                </button>
              </motion.div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <UserIcon className="h-7 w-7" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          customer.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                          customer.role === 'suspect' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {customer.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-lg">
                        {customer.name || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{customer.phone || 'No phone number'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="px-6 py-4 grid grid-cols-2 gap-4 bg-slate-50/50 border-y border-slate-100">
                    <div className="space-y-0.5 text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spend</p>
                      <p className="text-xl font-bold text-slate-900">${customer.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders</p>
                      <p className="text-xl font-bold text-slate-900">{customer.orderCount}</p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Last active: {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</span>
                      </div>
                      <button 
                        onClick={() => handleEditClick(customer)}
                        className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {customer.role !== 'admin' && (
                        <button 
                          onClick={() => setRoleChangeTarget({ userId: customer.id, newRole: 'admin' })}
                          disabled={isUpdating === customer.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all disabled:opacity-50 text-xs font-bold"
                        >
                          {isUpdating === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                          Promote
                        </button>
                      )}
                      {customer.role !== 'suspect' && (
                        <button 
                          onClick={() => setRoleChangeTarget({ userId: customer.id, newRole: 'suspect' })}
                          disabled={isUpdating === customer.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50 text-xs font-bold"
                        >
                          {isUpdating === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                          Flag
                        </button>
                      )}
                      {customer.role !== 'user' && (
                        <button 
                          onClick={() => setRoleChangeTarget({ userId: customer.id, newRole: 'user' })}
                          disabled={isUpdating === customer.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-50 text-xs font-bold"
                        >
                          {isUpdating === customer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserIcon className="h-3 w-3" />}
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Edit Modal */}
          {editingCustomer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingCustomer(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                      <Edit2 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-slate-900">Edit Customer</h2>
                      <p className="text-slate-500 text-sm font-medium">Profile: {editingCustomer.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingCustomer(null)}
                    className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter customer name"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setEditingCustomer(null)}
                      className="flex-1 px-6 py-4 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateCustomer}
                      disabled={isUpdating === editingCustomer.id}
                      className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 text-sm font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                    >
                      {isUpdating === editingCustomer.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Create Modal */}
          {isCreatingCustomer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreatingCustomer(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-slate-900">New Customer</h2>
                      <p className="text-slate-500 text-sm font-medium">Add a new profile to your directory.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreatingCustomer(false)}
                    className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="p-8 space-y-5">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        value={newCustomerName} 
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address *</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="email" 
                        value={newCustomerEmail} 
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        value={newCustomerPhone} 
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setIsCreatingCustomer(false)}
                      className="flex-1 px-6 py-4 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateCustomer}
                      disabled={isSubmittingCustomer || !newCustomerName || !newCustomerEmail}
                      className="flex-[2] flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 text-sm font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
                    >
                      {isSubmittingCustomer ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      Create Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Role Change Confirmation Modal */}
          {roleChangeTarget && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRoleChangeTarget(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center"
              >
                <div className="mx-auto w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
                  <AlertCircle className="h-10 w-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Change Role?</h3>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  Are you sure you want to change this user&apos;s role to <span className="font-bold text-indigo-600 uppercase tracking-wider">{roleChangeTarget.newRole}</span>?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRoleChangeTarget(null)}
                    className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRoleChange}
                    className="flex-1 px-4 py-3.5 text-sm font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    Confirm
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
