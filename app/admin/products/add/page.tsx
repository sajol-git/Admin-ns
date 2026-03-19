'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, Trash2, Check, Search, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { type Product } from '@/types';
import { GoogleGenAI } from '@google/genai';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import slugify from 'slugify';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { ImageUpload } from '@/components/ImageUpload';
import { createClient } from '@/utils/supabase/client';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AddProductPage() {
  const router = useRouter();
  const { categories = [], brands = [], setCategories, setBrands } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    price: '',
    compareAtPrice: '',
    featureImage: '',
    gallery: [''],
    category: '',
    brand: '',
    stock: '',
    status: 'draft' as 'draft' | 'published',
    isFeatured: false,
    isFlashSale: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: catData } = await supabase.from('categories').select('*');
      const { data: brandData } = await supabase.from('brands').select('*');
      if (catData) setCategories(catData);
      if (brandData) setBrands(brandData);
    };
    fetchData();
  }, [supabase, setCategories, setBrands]);

  useEffect(() => {
    if (categories && categories.length > 0 && brands && brands.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: prev.category || categories[0]?.name || '',
        brand: prev.brand || brands[0]?.name || ''
      }));
    }
  }, [categories, brands]);

  const generateDescription = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Please enter a product name and category first.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const prompt = `Write a compelling, premium e-commerce product description for a ${formData.category} product named "${formData.name}". Include key features and benefits. Keep it concise (around 3-4 sentences) and engaging.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (response.text) {
        setFormData(prev => ({ ...prev, description: response.text || '' }));
        toast.success('Description generated successfully!');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setIsSaving(true);
    const slug = formData.slug || slugify(formData.name, { lower: true, strict: true });
    
    const newProductData = {
      name: formData.name,
      slug: slug,
      status: formData.status,
      description: formData.description,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
      image_url: formData.featureImage.trim(),
      featureImage: formData.featureImage.trim(),
      gallery: formData.gallery.filter(img => img.trim() !== ''),
      category: formData.category,
      brand: formData.brand,
      stock: Number(formData.stock) || 0,
      is_featured: formData.isFeatured,
      isFlashSale: formData.isFlashSale,
      variants: [],
      specifications: [],
      relatedProducts: [],
    };

    try {
      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert([newProductData])
        .select()
        .single();

      if (error) throw error;
      
      if (insertedProduct) {
        // Update local store state
        const { addProduct } = useStore.getState();
        await addProduct(insertedProduct);
      }
      
      toast.success('Product added successfully');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-8">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-600 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Add New Product</h1>
            <p className="text-sm text-gray-500 font-medium">Create a new item for your storefront</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/products"
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            Discard
          </Link>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title and Description */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Product Title</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData, 
                      name: e.target.value,
                      slug: slugify(e.target.value, { lower: true, strict: true })
                    });
                  }}
                  placeholder="Short sleeve t-shirt"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">URL Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="short-sleeve-t-shirt"
                  disabled={formData.status === 'published'}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium disabled:opacity-50"
                />
                {formData.status === 'published' && (
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1 ml-1">Slug cannot be edited while published</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Meta Title (SEO)</label>
                <input 
                  type="text" 
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                  placeholder="SEO Title"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Description</label>
                  <button 
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGenerating ? 'Generating...' : 'Magic Write'}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-[2rem] overflow-hidden border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.description} 
                    onChange={(val) => setFormData({...formData, description: val})} 
                    className="h-64 mb-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Meta Description (SEO)</label>
                <textarea 
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                  rows={3}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Media Assets</h2>
            
            <div className="space-y-8">
              {/* Feature Image */}
              <div className="space-y-3">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Feature Image (Main Photo)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={formData.featureImage}
                    onChange={(e) => setFormData({...formData, featureImage: e.target.value})}
                    placeholder="https://example.com/feature-image.jpg"
                    className="flex-1 px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                  />
                  <ImageUpload 
                    onUpload={(url) => setFormData({...formData, featureImage: url})} 
                    buttonText="Upload Image" 
                    fileName={formData.name}
                  />
                </div>
                {formData.featureImage && (
                  <div className="mt-4 relative w-40 aspect-square rounded-[2rem] border-2 border-gray-100 overflow-hidden bg-gray-50 shadow-inner">
                    <Image 
                      src={formData.featureImage} 
                      alt="Feature Preview" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="space-y-4">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Gallery Images (Up to 10)</label>
                <div className="space-y-4">
                  {formData.gallery.map((url, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        value={url}
                        onChange={(e) => {
                          const newGallery = [...formData.gallery];
                          newGallery[index] = e.target.value;
                          setFormData({...formData, gallery: newGallery});
                        }}
                        placeholder={`Gallery image ${index + 1} URL`}
                        className="flex-1 px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                      />
                      <div className="flex gap-2">
                        <ImageUpload 
                          onUpload={(newUrl) => {
                            const newGallery = [...formData.gallery];
                            newGallery[index] = newUrl;
                            setFormData({...formData, gallery: newGallery});
                          }} 
                          buttonText="Upload" 
                          fileName={`${formData.name}_gallery_${index}`}
                        />
                        <button 
                          onClick={() => {
                            const newGallery = formData.gallery.filter((_, i) => i !== index);
                            setFormData({...formData, gallery: newGallery.length ? newGallery : ['']});
                          }}
                          className="p-3.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-95"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.gallery.length < 10 && (
                    <button 
                      onClick={() => setFormData({...formData, gallery: [...formData.gallery, '']})}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-2 ml-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add gallery image
                    </button>
                  )}
                </div>
                
                {/* Image Preview Grid */}
                {formData.gallery.filter(url => url.trim() !== '').length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {formData.gallery.filter(url => url.trim() !== '').map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-[1.5rem] border-2 border-gray-100 overflow-hidden bg-gray-50 shadow-inner group">
                        <Image 
                          src={url} 
                          alt={`Gallery Preview ${index}`} 
                          fill 
                          className="object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Pricing Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Base Price</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">৳</span>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Compare at price</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">৳</span>
                  <input 
                    type="number" 
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({...formData, compareAtPrice: e.target.value})}
                    className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Inventory Management</h2>
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Available Quantity</label>
              <input 
                type="number" 
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Status */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-4 tracking-tight uppercase tracking-widest text-xs">Publish Status</h2>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'published'})}
              className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm appearance-none cursor-pointer"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Product Organization */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 tracking-tight uppercase tracking-widest text-xs">Organization</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                <select 
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 tracking-tight uppercase tracking-widest text-xs">Visibility</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-gray-50 transition-all">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                    className="peer appearance-none w-6 h-6 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-500/10 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                  />
                  <Check className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Featured Product</span>
              </label>
              
              <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-gray-50 transition-all">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={formData.isFlashSale}
                    onChange={(e) => setFormData({...formData, isFlashSale: e.target.checked})}
                    className="peer appearance-none w-6 h-6 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-500/10 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                  />
                  <Check className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Flash Sale</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
