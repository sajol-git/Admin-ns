'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden block">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Featured
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Low Stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-[#8B183A] hover:text-white transition-colors shadow-lg">
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-[#8B183A] hover:text-white transition-colors shadow-lg">
            <Heart className="w-5 h-5" />
          </button>
          <Link href={`/product/${product.slug}`} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-[#8B183A] hover:text-white transition-colors shadow-lg">
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] font-bold text-[#8B183A] uppercase tracking-widest mb-1">
          {product.category}
        </div>
        <Link href={`/product/${product.slug}`} className="hover:text-[#8B183A] transition-colors">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex text-yellow-400">
              {"★".repeat(5)}
            </div>
            <span className="text-[10px] text-gray-400 font-bold">(4.8)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
