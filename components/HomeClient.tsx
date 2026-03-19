'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Product, Category } from '@/types';
import { useStore } from '@/store/useStore';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  status: 'Active' | 'Inactive';
}

interface HomeClientProps {
  initialBanners: HeroBanner[];
  initialCategories: Category[];
  initialProducts: Product[];
  settings: Record<string, string>;
}

export default function HomeClient({ 
  initialBanners, 
  initialCategories, 
  initialProducts,
  settings 
}: HomeClientProps) {
  const { setHeroBanners, setCategories, setProducts } = useStore();
  
  // Initialize store with server data
  useEffect(() => {
    setHeroBanners(initialBanners);
    setCategories(initialCategories);
    setProducts(initialProducts);
  }, [initialBanners, initialCategories, initialProducts, setHeroBanners, setCategories, setProducts]);

  const { heroBanners, categories, products } = useStore();
  
  const featuredProducts = products.filter(p => p.is_featured && p.status === 'published');
  const flashSaleProducts = products.filter(p => p.isFlashSale && p.status === 'published');
  
  // If no dynamic banners, use the single one from settings
  const activeBanners = heroBanners.length > 0 
    ? heroBanners.filter(b => b.status === 'Active')
    : settings['hero_image'] ? [{
        id: 'default',
        title: settings['hero_title'] || 'Everything You Need.',
        subtitle: settings['hero_subtitle'] || 'Curated products for the modern lifestyle.',
        button_text: settings['hero_button_text'] || 'Shop Now',
        button_link: settings['hero_button_link'] || '#products',
        image_url: settings['hero_image'],
        status: 'Active' as const
      }] : [];

  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const bannerTimer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, [activeBanners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[650px] overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          {activeBanners.length > 0 ? (
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={activeBanners[currentBanner].image_url}
                alt={activeBanners[currentBanner].title}
                fill
                className="object-cover"
                priority
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl text-white">
                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter uppercase"
                    >
                      {activeBanners[currentBanner].title}
                    </motion.h2>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg md:text-xl mb-8 text-gray-200 font-medium max-w-lg"
                    >
                      {activeBanners[currentBanner].subtitle}
                    </motion.p>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Link
                        href={activeBanners[currentBanner].button_link}
                        className="bg-[#8B183A] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#721430] transition-all inline-flex items-center gap-2 shadow-xl hover:scale-105"
                      >
                        {activeBanners[currentBanner].button_text}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </AnimatePresence>

        {/* Banner Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBanner(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentBanner === idx ? 'bg-[#8B183A] w-8' : 'bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Browse by Category</h2>
              <p className="text-gray-500">Find exactly what you&apos;re looking for</p>
            </div>
            <Link href="/categories" className="text-[#8B183A] font-bold hover:underline flex items-center gap-1 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex-shrink-0 w-40 text-center"
              >
                <div className="relative w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-transparent group-hover:border-[#8B183A] transition-all shadow-lg">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-[#8B183A] transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#8B183A] rounded-[2rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 mb-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Flash Sale</h2>
                  <p className="text-white/70 font-medium">Limited time offer, grab yours now!</p>
                </div>
              </div>
              
              <div className="relative z-10 flex gap-4">
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl w-20 py-4 text-3xl font-bold mb-1 border border-white/10">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Hours</span>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl w-20 py-4 text-3xl font-bold mb-1 border border-white/10">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Mins</span>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl w-20 py-4 text-3xl font-bold mb-1 border border-white/10">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Secs</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Featured Products</h2>
              <p className="text-gray-500">Handpicked items just for you</p>
            </div>
            <Link href="/products" className="text-[#8B183A] font-bold hover:underline flex items-center gap-1 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B183A] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Stay in the Loop</h2>
            <p className="text-gray-400 text-lg mb-10">
              Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and tech trends.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-[#8B183A] transition-colors"
              />
              <button className="bg-[#8B183A] text-white px-10 py-4 rounded-full font-bold hover:bg-[#721430] transition-all shadow-lg hover:scale-105">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
