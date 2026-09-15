import { create } from 'zustand';

export type GalleryCategory = 'all' | 'exterior' | 'interior' | 'aerial' | 'night' | 'detail';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  imageUrl: string;
  prompt?: string;
  description?: string;
}

export interface GalleryState {
  selectedCategory: GalleryCategory;
  selectedItem: GalleryItem | null;
  searchQuery: string;

  // Actions
  setCategory: (category: GalleryCategory) => void;
  selectItem: (item: GalleryItem | null) => void;
  setSearchQuery: (query: string) => void;
  resetFilter: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  selectedCategory: 'all',
  selectedItem: null,
  searchQuery: '',

  setCategory: (selectedCategory) => set({ selectedCategory }),
  selectItem: (selectedItem) => set({ selectedItem }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilter: () => set({
    selectedCategory: 'all',
    selectedItem: null,
    searchQuery: '',
  }),
}));
