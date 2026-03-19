'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export async function createCustomerProfile(data: {
  name: string;
  phone: string;
  email: string;
}) {
  const supabaseAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  
  const supabase = await createClient();

  try {
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: data.email,
      password: Math.random().toString(36).slice(-10) + 'A1!', // Random secure password
      options: {
        data: {
          name: data.name,
          phone: data.phone,
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Update the profile to ensure phone is set and role is user
      await supabase.from('profiles').update({ 
        phone: data.phone, 
        name: data.name, 
        role: 'user' 
      }).eq('id', authData.user.id);
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    return { error: error.message || 'Failed to create customer' };
  }
}

export async function createOrderWithCustomer(data: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  createNewProfile: boolean;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
}) {
  const supabaseAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  
  const supabase = await createClient();

  try {
    // 1. Optionally create a new user profile
    if (data.createNewProfile && data.customerEmail) {
      const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
        email: data.customerEmail,
        password: Math.random().toString(36).slice(-10) + 'A1!', // Random secure password
        options: {
          data: {
            name: data.customerName,
            phone: data.customerPhone,
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        // We can continue and just create the order anyway
      } else if (authData.user) {
        // Update the profile to ensure phone is set and role is user
        // Using the authenticated client to update the profile
        await supabase.from('profiles').update({ 
          phone: data.customerPhone, 
          name: data.customerName, 
          role: 'user' 
        }).eq('id', authData.user.id);
      }
    }

    // 2. Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_address: data.customerAddress,
        total: data.total,
        status: 'Pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Create order items
    const orderItems = data.items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 4. Create initial tracking history
    await supabase
      .from('order_tracking_history')
      .insert([{
        order_id: orderData.id,
        status: 'Pending',
        message: 'Order created by admin.'
      }]);

    return { success: true, order: orderData };
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return { error: error.message || 'Failed to create order' };
  }
}
