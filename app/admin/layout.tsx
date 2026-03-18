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
    <div className="flex h-screen overflow-hidden bg-bg text-ink">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-bg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-mono text-xl font-bold tracking-tighter">NEEDIE_ADMIN</span>
            <button onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 font-mono text-sm uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-ink text-bg' : 'hover:bg-line/10'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-line p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 font-mono text-sm uppercase tracking-wider hover:bg-line/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-line px-4 md:hidden">
          <button onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-mono text-xl font-bold tracking-tighter">NEEDIE_ADMIN</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
