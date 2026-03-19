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
