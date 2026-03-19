import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product, Category } from '@/types';

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      categories: [],
      setCategories: (categories) => set({ categories }),
      brands: [],
      setBrands: (brands) => set({ brands }),
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: async (product) => {
        set((state) => ({ products: [product, ...state.products] }));
      },
    }),
    {
      name: 'needie-admin-storage',
    }
  )
);
