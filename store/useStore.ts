import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product, Category } from '@/types';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  status: 'Active' | 'Inactive';
}

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  heroBanners: HeroBanner[];
  setHeroBanners: (banners: HeroBanner[]) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      heroBanners: [],
      setHeroBanners: (heroBanners) => set({ heroBanners }),
      categories: [],
      setCategories: (categories) => set({ categories }),
      products: [],
      setProducts: (products) => set({ products }),
    }),
    {
      name: 'needie-admin-storage',
    }
  )
);
