import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error('Supabase getUser error:', error);
  }

  // Fetch featured products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .limit(6);

  return (
    <div className="min-h-screen bg-bg font-mono">
      {/* Header */}
      <header className="border-b border-line p-6 flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-3xl font-bold tracking-tighter">NEEDIE_STORE</h1>
        <nav className="space-x-6">
          <Link href="/" className="hover:underline uppercase tracking-widest text-sm font-bold">Shop</Link>
          {user ? (
            <Link href="/profile" className="hover:underline uppercase tracking-widest text-sm font-bold">Profile</Link>
          ) : (
            <Link href="/login" className="hover:underline uppercase tracking-widest text-sm font-bold bg-ink text-white px-4 py-2">Login</Link>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="p-12 border-b border-line bg-zinc-100 flex flex-col items-center justify-center text-center min-h-[40vh]">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 uppercase">
          Everything You Need.
        </h2>
        <p className="text-xl md:text-2xl max-w-2xl text-zinc-600 mb-8">
          Curated products for the modern lifestyle. Quality over quantity.
        </p>
        <Link href="#products" className="bg-ink text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          Shop Now
        </Link>
      </section>

      {/* Products Grid */}
      <main id="products" className="p-8 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold uppercase tracking-widest mb-8 border-b border-line pb-4">Featured Items</h3>
        
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link href={`/product/${product.slug}`} key={product.id} className="group block border border-line bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all">
                <div className="aspect-square bg-zinc-100 relative border-b border-line overflow-hidden">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400">No Image</div>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{product.category}</div>
                  <h4 className="text-xl font-bold mb-2 truncate">{product.name}</h4>
                  <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-line">
            No products available at the moment.
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-line p-8 text-center text-sm text-zinc-500 uppercase tracking-widest mt-20">
        &copy; {new Date().getFullYear()} NEEDIE_STORE. All rights reserved.
      </footer>
    </div>
  );
}
