'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  settings?: Record<string, string>;
}

export function Header({ settings }: HeaderProps) {
  const logo = settings?.['site_logo'];
  const siteName = settings?.['site_name'] || 'NeedieShop';

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu */}
          <button className="lg:hidden p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            {logo ? (
              <div className="relative h-8 w-32">
                <Image 
                  src={logo}
                  alt={siteName}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <span className="text-xl font-black tracking-tighter text-gray-900 uppercase italic">
                {siteName}
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-gray-900 hover:text-[#8B183A] transition-colors uppercase tracking-widest">Home</Link>
            <Link href="/products" className="text-sm font-bold text-gray-900 hover:text-[#8B183A] transition-colors uppercase tracking-widest">Shop</Link>
            <Link href="/categories" className="text-sm font-bold text-gray-900 hover:text-[#8B183A] transition-colors uppercase tracking-widest">Categories</Link>
            <Link href="/about" className="text-sm font-bold text-gray-900 hover:text-[#8B183A] transition-colors uppercase tracking-widest">About</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-[#8B183A] transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/login" className="p-2 text-gray-600 hover:text-[#8B183A] transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="p-2 text-gray-600 hover:text-[#8B183A] transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#8B183A] text-white text-[10px] flex items-center justify-center rounded-full font-bold">0</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
