import { create } from 'zustand';

export interface RoofParams {
  roofWidth: number;   // Along Ridge/Dori direction (X axis), in meters
  roofDepth: number;   // Along Slope/Beam direction (Z axis), in meters
  tileCount: number;   // Number of tile columns along X axis
  roofAngle: number;   // Roof pitch angle in degrees (e.g. 24°)
  rafterPitch: number; // Interval between rafters in meters
  eavesOverhang: number; // 처마 내밀기 길이 in meters
}

export interface RoofState {
  hasRoof: boolean;
  params: RoofParams;

  // Actions
  setRoofParams: (params: Partial<RoofParams>) => void;
  createRoof: () => void;
  removeRoof: () => void;
  toggleRoof: () => void;
}

export const useRoofStore = create<RoofState>((set) => ({
  hasRoof: false,
  params: {
    roofWidth: 6.8,
    roofDepth: 6.2,
    tileCount: 22,
    roofAngle: 24,
    rafterPitch: 0.35,
    eavesOverhang: 0.75,
  },

  setRoofParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  createRoof: () => set({ hasRoof: true }),
  removeRoof: () => set({ hasRoof: false }),
  toggleRoof: () => set((state) => ({ hasRoof: !state.hasRoof })),
}));
