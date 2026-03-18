'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, UserRole } from '@/types';
import { Search, Shield, ShieldAlert, User as UserIcon, Loader2 } from 'lucide-react';

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

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search)
  );

  const [editingCustomer, setEditingCustomer] = useState<CustomerStats | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

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
      alert('Failed to update customer details.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    
    setIsUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setCustomers(customers.map(c => c.id === userId ? { ...c, role: newRole } : c));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role. Ensure you have super-admin privileges.');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-line bg-bg pl-10 pr-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full p-8 text-center font-mono opacity-50 border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            No customers found.
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col">
              <div className="p-4 border-b border-line flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-ink text-bg p-2 rounded-none">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold truncate w-32">{customer.name || 'Unknown'}</h3>
                    <p className="font-mono text-xs opacity-70">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider border ${
                    customer.role === 'admin' ? 'border-ink bg-ink text-bg' : 
                    customer.role === 'suspect' ? 'border-red-500 text-red-600 bg-red-50' : 
                    'border-line'
                  }`}>
                    {customer.role}
                  </span>
                  <button 
                    onClick={() => handleEditClick(customer)}
                    className="text-[10px] font-mono uppercase tracking-wider hover:underline"
                  >
                    [Edit Profile]
                  </button>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="col-header mb-1">Total Spend</p>
                  <p className="font-mono text-lg">${customer.totalSpend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="col-header mb-1">Orders</p>
                  <p className="font-mono text-lg">{customer.orderCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="col-header mb-1">Last Active</p>
                  <p className="font-mono text-sm opacity-80">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-line bg-line/5 flex justify-between items-center">
                <p className="col-header">Manage Role</p>
                <div className="flex gap-2">
                  {customer.role !== 'admin' && (
                    <button 
                      onClick={() => handleRoleChange(customer.id, 'admin')}
                      disabled={isUpdating === customer.id}
                      className="p-1.5 border border-line hover:bg-ink hover:text-bg transition-colors disabled:opacity-50"
                      title="Promote to Admin"
                    >
                      {isUpdating === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    </button>
                  )}
                  {customer.role !== 'suspect' && (
                    <button 
                      onClick={() => handleRoleChange(customer.id, 'suspect')}
                      disabled={isUpdating === customer.id}
                      className="p-1.5 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                      title="Flag as Suspect"
                    >
                      {isUpdating === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                    </button>
                  )}
                  {customer.role !== 'user' && (
                    <button 
                      onClick={() => handleRoleChange(customer.id, 'user')}
                      disabled={isUpdating === customer.id}
                      className="p-1.5 border border-line hover:bg-line/10 transition-colors disabled:opacity-50"
                      title="Reset to User"
                    >
                      {isUpdating === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserIcon className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-line bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-mono font-bold tracking-tighter">EDIT_CUSTOMER</h2>
              <button onClick={() => setEditingCustomer(null)} className="font-mono text-sm uppercase tracking-wider hover:underline">
                [Close]
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="col-header block">Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink" 
                />
              </div>
              <div className="space-y-2">
                <label className="col-header block">Phone</label>
                <input 
                  type="text" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-line bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink" 
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-line">
                <button onClick={() => setEditingCustomer(null)} className="px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-line/10 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCustomer}
                  disabled={isUpdating === editingCustomer.id}
                  className="flex items-center gap-2 bg-ink text-bg px-6 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {isUpdating === editingCustomer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
