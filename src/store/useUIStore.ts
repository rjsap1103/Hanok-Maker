import { create } from 'zustand';

export interface UIState {
  isStarted: boolean;
  isInventoryOpen: boolean;
  isBottomSheetOpen: boolean;
  activeModal: string | null;

  // Actions
  setIsStarted: (isStarted: boolean) => void;
  toggleInventory: () => void;
  setIsInventoryOpen: (isOpen: boolean) => void;
  toggleBottomSheet: () => void;
  setIsBottomSheetOpen: (isOpen: boolean) => void;
  setActiveModal: (modalName: string | null) => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isStarted: false,
  isInventoryOpen: true,
  isBottomSheetOpen: false,
  activeModal: null,

  setIsStarted: (isStarted) => set({ isStarted }),
  toggleInventory: () => set((state) => ({ isInventoryOpen: !state.isInventoryOpen })),
  setIsInventoryOpen: (isInventoryOpen) => set({ isInventoryOpen }),
  toggleBottomSheet: () => set((state) => ({ isBottomSheetOpen: !state.isBottomSheetOpen })),
  setIsBottomSheetOpen: (isBottomSheetOpen) => set({ isBottomSheetOpen }),
  setActiveModal: (activeModal) => set({ activeModal }),
  resetUI: () => set({
    isStarted: false,
    isInventoryOpen: true,
    isBottomSheetOpen: false,
    activeModal: null,
  }),
}));
