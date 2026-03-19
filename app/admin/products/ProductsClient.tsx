'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product, Category, Brand } from '@/types';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Wand2, 
  Loader2, 
  X,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Star
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  status: z.enum(['published', 'draft']),
  is_featured: z.boolean(),
  image_url: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsClient({ 
  initialProducts,
  categories = [],
  brands = []
}: { 
  initialProducts: Product[],
  categories?: Category[],
  brands?: Brand[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'draft',
      is_featured: false,
      stock: 0,
      price: 0,
    }
  });

  // Auto-generate slug from name
  const name = watch('name');
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    setValue('slug', value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        brand: product.brand,
        status: product.status,
        is_featured: product.is_featured,
        image_url: product.image_url,
      });
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        category: categories[0]?.name || '',
        brand: brands[0]?.name || '',
        status: 'draft',
        is_featured: false,
        image_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id);
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
      } else {
        const { data: newProducts, error } = await supabase
          .from('products')
          .insert([data])
          .select()
          .limit(1);
        if (error) throw error;
        const newProduct = newProducts?.[0];
        if (newProduct) setProducts([newProduct, ...products]);
      }
      closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(`Failed to save product: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  const generateDescription = async () => {
    const name = watch('name');
    const category = watch('category');
    const brand = watch('brand');
    
    if (!name) {
      alert('Please enter a product name first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, brand }),
      });
      
      if (!response.ok) throw new Error('Failed to generate');
      
      const { description } = await response.json();
      setValue('description', description);
    } catch (error) {
      console.error('Error generating description:', error);
      alert('Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-line bg-bg pl-10 pr-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>
          <div className="flex border border-line p-1 bg-bg">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-ink text-bg' : 'hover:bg-line/10'}`}
              title="Table View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-ink text-bg' : 'hover:bg-line/10'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-ink text-bg px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_100px] p-4 border-b border-line bg-line/5">
              <div className="col-header">Product Name</div>
              <div className="col-header">Category</div>
              <div className="col-header text-right">Price</div>
              <div className="col-header text-right">Stock</div>
              <div className="col-header text-center">Status</div>
              <div className="col-header text-right">Actions</div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center font-mono opacity-50">No products found.</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-[1fr_1fr_100px_100px_100px_100px] p-4 border-b border-line items-center hover:bg-line/5 transition-colors">
                  <div className="font-mono font-bold truncate pr-4">{product.name}</div>
                  <div className="font-mono text-sm opacity-70 truncate pr-4">{product.category}</div>
                  <div className="font-mono text-right">${product.price.toFixed(2)}</div>
                  <div className="font-mono text-right">
                    <span className={`px-2 py-1 text-xs ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="font-mono text-center">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider ${product.status === 'published' ? 'border border-ink' : 'border border-line border-dashed opacity-50'}`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(product)} className="p-1 hover:bg-line/10 transition-colors" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1 hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full p-12 border border-line border-dashed text-center font-mono opacity-50">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all flex flex-col"
              >
                <div className="relative aspect-square bg-line/5 border-b border-line overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <LayoutGrid className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {product.is_featured && (
                      <div className="bg-yellow-400 text-ink text-[10px] font-bold uppercase px-2 py-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                        Featured
                      </div>
                    )}
                    <div className={`text-[10px] font-bold uppercase px-2 py-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${
                      product.status === 'published' ? 'bg-green-400 text-ink' : 'bg-line text-bg'
                    }`}>
                      {product.status}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => openModal(product)}
                      className="bg-bg text-ink p-3 rounded-none hover:bg-yellow-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="bg-bg text-red-600 p-3 rounded-none hover:bg-red-600 hover:text-bg transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-mono uppercase opacity-50">
                      {product.brand} • {product.category}
                    </div>
                    <div className="font-mono font-bold text-lg">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <h3 className="font-mono font-bold text-base mb-4 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-line/10">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs font-mono opacity-70">{product.stock} in stock</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-bg border-4 border-ink w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="p-4 border-b-4 border-ink bg-ink text-bg flex justify-between items-center">
              <h2 className="font-mono font-bold uppercase tracking-tighter text-xl">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex border-b-4 border-ink bg-line/5">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-3 font-mono font-bold uppercase text-sm transition-colors ${
                  activeTab === 'edit' ? 'bg-bg text-ink' : 'hover:bg-line/10 opacity-50'
                }`}
              >
                Edit Details
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 font-mono font-bold uppercase text-sm transition-colors ${
                  activeTab === 'preview' ? 'bg-bg text-ink' : 'hover:bg-line/10 opacity-50'
                }`}
              >
                Visual Preview
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'edit' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Product Name</label>
                      <input
                        {...register('name')}
                        onChange={handleNameChange}
                        className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none"
                      />
                      {errors.name && <p className="text-red-600 text-[10px] font-mono">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Slug</label>
                      <input
                        {...register('slug')}
                        className="w-full border-2 border-ink p-2 font-mono bg-line/5 outline-none"
                      />
                      {errors.slug && <p className="text-red-600 text-[10px] font-mono">{errors.slug.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Category</label>
                      <select
                        {...register('category')}
                        className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-600 text-[10px] font-mono">{errors.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Brand</label>
                      <select
                        {...register('brand')}
                        className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none"
                      >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                      </select>
                      {errors.brand && <p className="text-red-600 text-[10px] font-mono">{errors.brand.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('price', { valueAsNumber: true })}
                        className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none"
                      />
                      {errors.price && <p className="text-red-600 text-[10px] font-mono">{errors.price.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-xs font-bold uppercase">Stock</label>
                      <input
                        type="number"
                        {...register('stock', { valueAsNumber: true })}
                        className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none"
                      />
                      {errors.stock && <p className="text-red-600 text-[10px] font-mono">{errors.stock.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block font-mono text-xs font-bold uppercase">Description (HTML Supported)</label>
                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={isGenerating}
                        className="text-[10px] font-mono font-bold uppercase bg-ink text-bg px-2 py-1 hover:bg-opacity-80 disabled:opacity-50"
                      >
                        {isGenerating ? 'Generating...' : 'Auto-Generate'}
                      </button>
                    </div>
                    <textarea
                      {...register('description')}
                      rows={6}
                      className="w-full border-2 border-ink p-2 font-mono focus:bg-yellow-50 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <CloudinaryUpload
                      label="Product Image"
                      value={watch('image_url') || ''}
                      onChange={(url) => setValue('image_url', url)}
                      onRemove={() => setValue('image_url', null)}
                    />
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-line/5 border-2 border-ink">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" {...register('is_featured')} className="h-4 w-4 border-2 border-ink" />
                      <span className="font-mono text-xs font-bold uppercase group-hover:text-yellow-600">Featured Product</span>
                    </label>
                    <div className="h-4 w-px bg-ink/20" />
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold uppercase">Status:</span>
                      <div className="flex border-2 border-ink">
                        {['draft', 'published'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setValue('status', s as any)}
                            className={`px-3 py-1 font-mono text-[10px] uppercase font-bold transition-colors ${
                              watch('status') === s ? 'bg-ink text-bg' : 'bg-bg text-ink hover:bg-line/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-2 font-mono text-sm font-bold uppercase border-2 border-ink hover:bg-line/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 font-mono text-sm font-bold uppercase bg-ink text-bg hover:bg-opacity-90 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square border-4 border-ink bg-line/5 overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
                      {watch('image_url') ? (
                        <img 
                          src={watch('image_url') || ''} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                          <LayoutGrid className="h-16 w-16 mb-2" />
                          <span className="font-mono text-xs uppercase font-bold">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-ink text-bg text-[10px] font-bold uppercase px-2 py-0.5">
                            {watch('brand') || 'No Brand'}
                          </span>
                          <span className="border border-ink text-[10px] font-bold uppercase px-2 py-0.5">
                            {watch('category') || 'No Category'}
                          </span>
                        </div>
                        <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter leading-none mb-2">
                          {watch('name') || 'Product Name'}
                        </h1>
                        <div className="text-2xl font-mono font-bold text-yellow-600">
                          ${(watch('price') || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1 border-2 border-ink p-3 bg-line/5">
                          <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Stock Level</div>
                          <div className="font-mono font-bold">{watch('stock') || 0} Units</div>
                        </div>
                        <div className="flex-1 border-2 border-ink p-3 bg-line/5">
                          <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Featured</div>
                          <div className="font-mono font-bold">{watch('is_featured') ? 'YES' : 'NO'}</div>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-ink bg-yellow-50">
                        <div className="flex items-center gap-2 text-ink">
                          <div className={`h-2 w-2 rounded-full ${watch('status') === 'published' ? 'bg-green-500' : 'bg-line'}`} />
                          <span className="font-mono text-xs font-bold uppercase">Status: {watch('status')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-mono font-bold uppercase border-b-2 border-ink pb-2">Product Description</h3>
                    <div 
                      className="prose prose-sm max-w-none font-mono text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: watch('description') || '<p className="opacity-50 italic">No description provided.</p>' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
