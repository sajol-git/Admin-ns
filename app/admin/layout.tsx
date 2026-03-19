'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  Tags,
  Bookmark
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Brands', href: '/admin/brands', icon: Bookmark },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useStore();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white shadow-sm transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <span className="text-xl font-bold tracking-tight text-indigo-600">Needie Admin</span>
            <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-900">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:hidden">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-xl font-bold tracking-tight text-indigo-600">Needie Admin</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
