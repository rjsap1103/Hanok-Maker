import { create } from 'zustand';

export interface PlacedPart {
  id: string;
  partId: string;
  name: string;
  category: string;
  type?: string;                             // 부재 상세 타입 (예: "purlin")
  level?: 'eave' | 'middle' | 'ridge';       // 도리 레벨 ("eave" | "middle" | "ridge")
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
  purlinLevel?: 'eave' | 'middle' | 'ridge'; // 기존 호환용 필드
}

export type FloorMaterialType = 'wood' | 'ondol' | 'earth';

export interface FloorMeshData {
  visible: boolean;
  center: [number, number, number];
  size: [number, number]; // [width, depth]
  material?: FloorMaterialType; // Default 'wood' (마루)
}

export interface BuildState {
  currentStep: number;
  selectedPart: string | null;
  placedParts: PlacedPart[];
  floorMesh: FloorMeshData | null;
  selectedObject: string | null;
  isBuilding: boolean;
  isComplete: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectPart: (partId: string | null) => void;
  addPart: (part: PlacedPart) => void;
  removePart: (id: string) => void;
  setFloorMesh: (floorMesh: FloorMeshData | null) => void;
  setFloorMaterial: (material: FloorMaterialType) => void;
  generateFloorFromFoundations: () => boolean;
  selectObject: (id: string | null) => void;
  setIsBuilding: (isBuilding: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
  resetBuild: () => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  currentStep: 1,
  selectedPart: 'foundation_stone',
  placedParts: [],
  floorMesh: null,
  selectedObject: null,
  isBuilding: true,
  isComplete: false,

  setStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  selectPart: (selectedPart) => set({ selectedPart }),
  addPart: (part) => set((state) => ({ placedParts: [...state.placedParts, part] })),
  removePart: (id) => set((state) => ({ placedParts: state.placedParts.filter((p) => p.id !== id) })),
  setFloorMesh: (floorMesh) => set({ floorMesh }),
  setFloorMaterial: (material: FloorMaterialType) =>
    set((state) => ({
      floorMesh: state.floorMesh ? { ...state.floorMesh, material } : null,
    })),
  generateFloorFromFoundations: () => {
    const foundations = get().placedParts.filter(
      (p) => p.category === 'foundation' || p.partId === 'foundation_stone'
    );
    if (foundations.length < 4) return false;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    foundations.forEach((f) => {
      const [x, , z] = f.position;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    const FOUNDATION_SIZE = 0.9;
    const FLOOR_TOP_Y = 0.505;
    const FLOOR_THICKNESS = 0.08;

    const width = maxX - minX + FOUNDATION_SIZE;
    const depth = maxZ - minZ + FOUNDATION_SIZE;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const floorMesh: FloorMeshData = {
      visible: true,
      center: [centerX, FLOOR_TOP_Y - FLOOR_THICKNESS / 2, centerZ],
      size: [width, depth],
      material: 'wood', // 기본 재질: 마루(Wood Flooring)
    };

    set({
      floorMesh,
      currentStep: 2,
      selectedPart: 'pillar_round',
    });

    return true;
  },
  selectObject: (selectedObject) => set({ selectedObject }),
  setIsBuilding: (isBuilding) => set({ isBuilding }),
  setIsComplete: (isComplete) => set({ isComplete }),
  resetBuild: () => set({
    currentStep: 1,
    selectedPart: 'foundation_stone',
    placedParts: [],
    floorMesh: null,
    selectedObject: null,
    isBuilding: true,
    isComplete: false,
  }),
}));
