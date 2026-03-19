export type ProductStatus = 'published' | 'draft';
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type UserRole = 'admin' | 'user' | 'suspect';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  brand: string;
  status: ProductStatus;
  is_featured: boolean;
  isFlashSale?: boolean;
  image_url?: string | null;
  featureImage?: string;
  gallery?: string[];
  variants?: any[];
  specifications?: any[];
  relatedProducts?: any[];
  created_at?: string;
}

export interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email?: string;
  created_at?: string;
}

export interface OrderItem {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface OrderTrackingHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  message: string;
  created_at: string;
}

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at?: string;
}
