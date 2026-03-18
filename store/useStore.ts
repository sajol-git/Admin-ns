import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'needie-admin-storage',
    }
  )
);
