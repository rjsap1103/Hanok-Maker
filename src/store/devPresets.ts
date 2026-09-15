// Developer preset templates for testing Hanok components
import type { PlacedPart } from './useBuildStore';

// 1. Five Components Showcase (Single row 5 bays)
export const DEMO_PRESET_PARTS: PlacedPart[] = [
  // 6 Pillars forming 5 bays to showcase each component
  { id: 'p0', partId: 'pillar_round', name: '기둥 0', category: 'pillar', position: [-8, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p1', partId: 'pillar_round', name: '기둥 1', category: 'pillar', position: [-4, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p2', partId: 'pillar_round', name: '기둥 2', category: 'pillar', position: [0, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p3', partId: 'pillar_round', name: '기둥 3', category: 'pillar', position: [4, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p4', partId: 'pillar_round', name: '기둥 4', category: 'pillar', position: [8, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p5', partId: 'pillar_round', name: '기둥 5', category: 'pillar', position: [12, 1.65, 0], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },

  // Top Beams spanning the bays
  { id: 'b0', partId: 'beam_daedeulbo', name: '대들보 0', category: 'beam', position: [-6, 3.21, 0], rotation: [0, 0, 0], scale: [4.3, 0.32, 0.28] },
  { id: 'b1', partId: 'beam_daedeulbo', name: '대들보 1', category: 'beam', position: [-2, 3.21, 0], rotation: [0, 0, 0], scale: [4.3, 0.32, 0.28] },
  { id: 'b2', partId: 'beam_daedeulbo', name: '대들보 2', category: 'beam', position: [2, 3.21, 0], rotation: [0, 0, 0], scale: [4.3, 0.32, 0.28] },
  { id: 'b3', partId: 'beam_daedeulbo', name: '대들보 3', category: 'beam', position: [6, 3.21, 0], rotation: [0, 0, 0], scale: [4.3, 0.32, 0.28] },
  { id: 'b4', partId: 'beam_daedeulbo', name: '대들보 4', category: 'beam', position: [10, 3.21, 0], rotation: [0, 0, 0], scale: [4.3, 0.32, 0.28] },

  // Bay 1: EARTH WALL
  {
    id: 'test_earth_wall',
    partId: 'wall_earth',
    name: '외엮기 흙벽 (Earth Wall)',
    category: 'wall',
    position: [-6, 1.65, 0],
    rotation: [0, 0, 0],
    scale: [3.68, 2.6, 0.16],
  },

  // Bay 2: WOOD WALL
  {
    id: 'test_wood_wall',
    partId: 'wall_wood',
    name: '판벽 (Wood Wall)',
    category: 'wall',
    position: [-2, 1.65, 0],
    rotation: [0, 0, 0],
    scale: [3.68, 2.6, 0.16],
  },

  // Bay 3: LATTICE WINDOW
  {
    id: 'test_lattice_window',
    partId: 'window_lattice',
    name: '세살 격자창 (Lattice Window)',
    category: 'window',
    position: [2, 1.65, 0],
    rotation: [0, 0, 0],
    scale: [3.68, 2.6, 0.16],
  },

  // Bay 4: SLIDING DOOR
  {
    id: 'test_sliding_door',
    partId: 'door_sliding',
    name: '미닫이 세살문 (Sliding Door)',
    category: 'door',
    position: [6, 1.65, 0],
    rotation: [0, 0, 0],
    scale: [3.68, 2.6, 0.16],
  },

  // Bay 5: TRADITIONAL DOOR
  {
    id: 'test_traditional_door',
    partId: 'door_traditional',
    name: '전통 띠살 판문 (Traditional Door)',
    category: 'door',
    position: [10, 1.65, 0],
    rotation: [0, 0, 0],
    scale: [3.68, 2.6, 0.16],
  },
];

// 2. Square Box Room (4 Pillars, 4 Beams, 4 Walls forming a 4-sided rectangular Hanok room)
export const DEMO_BOX_ROOM_PARTS: PlacedPart[] = [
  // 4 Foundations at 4 corners
  { id: 'f_tl', partId: 'foundation_stone', name: '주춧돌 (-2, -2)', category: 'foundation', position: [-2, 0.25, -2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_tr', partId: 'foundation_stone', name: '주춧돌 (2, -2)', category: 'foundation', position: [2, 0.25, -2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_br', partId: 'foundation_stone', name: '주춧돌 (2, 2)', category: 'foundation', position: [2, 0.25, 2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_bl', partId: 'foundation_stone', name: '주춧돌 (-2, 2)', category: 'foundation', position: [-2, 0.25, 2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },

  // 4 Pillars on the foundations
  { id: 'p_tl', partId: 'pillar_round', name: '기둥 북서', category: 'pillar', position: [-2, 1.9, -2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_tr', partId: 'pillar_round', name: '기둥 북동', category: 'pillar', position: [2, 1.9, -2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_br', partId: 'pillar_round', name: '기둥 남동', category: 'pillar', position: [2, 1.9, 2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_bl', partId: 'pillar_round', name: '기둥 남서', category: 'pillar', position: [-2, 1.9, 2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },

  // 4 Connecting Beams forming a closed rectangular box frame (mortised into pillar heads at Y=3.24)
  { id: 'b_north', partId: 'beam_daedeulbo', name: '대들보 북측', category: 'beam', position: [0, 3.24, -2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_east', partId: 'beam_daedeulbo', name: '대들보 동측', category: 'beam', position: [2, 3.24, 0], rotation: [0, Math.PI / 2, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_south', partId: 'beam_daedeulbo', name: '대들보 남측', category: 'beam', position: [0, 3.24, 2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_west', partId: 'beam_daedeulbo', name: '대들보 서측', category: 'beam', position: [-2, 3.24, 0], rotation: [0, Math.PI / 2, 0], scale: [4.0, 0.32, 0.28] },

  // 4 Walls / Openings on the 4 faces
  // North face: Earth Wall
  {
    id: 'w_north',
    partId: 'wall_earth',
    name: '외엮기 흙벽 (North)',
    category: 'wall',
    position: [0, 1.9, -2],
    rotation: [0, 0, 0],
    scale: [3.78, 2.8, 0.16],
  },
  // East face: Wood Wall
  {
    id: 'w_east',
    partId: 'wall_wood',
    name: '판벽 (East)',
    category: 'wall',
    position: [2, 1.9, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [3.78, 2.8, 0.16],
  },
  // South face: Sliding Door (Front entrance)
  {
    id: 'w_south',
    partId: 'door_sliding',
    name: '미닫이 세살문 (South)',
    category: 'door',
    position: [0, 1.9, 2],
    rotation: [0, 0, 0],
    scale: [3.78, 2.8, 0.16],
  },
  // West face: Lattice Window (Sesal-chang)
  {
    id: 'w_west',
    partId: 'window_lattice',
    name: '세살 격자창 (West)',
    category: 'window',
    position: [-2, 1.9, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [3.78, 2.8, 0.16],
  },
];

// 3. Six Foundations Preset (3 bays wide x 2 bays deep)
export const DEMO_FOUNDATIONS_6: PlacedPart[] = [
  { id: 'f_0', partId: 'foundation_stone', name: '주춧돌 (-4, -2)', category: 'foundation', position: [-4, 0.25, -2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_1', partId: 'foundation_stone', name: '주춧돌 (0, -2)', category: 'foundation', position: [0, 0.25, -2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_2', partId: 'foundation_stone', name: '주춧돌 (4, -2)', category: 'foundation', position: [4, 0.25, -2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_3', partId: 'foundation_stone', name: '주춧돌 (4, 2)', category: 'foundation', position: [4, 0.25, 2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_4', partId: 'foundation_stone', name: '주춧돌 (0, 2)', category: 'foundation', position: [0, 0.25, 2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
  { id: 'f_5', partId: 'foundation_stone', name: '주춧돌 (-4, 2)', category: 'foundation', position: [-4, 0.25, 2], rotation: [0, 0, 0], scale: [0.9, 0.5, 0.9] },
];

// 4. Six Pillars Full House (2 bays wide x 1 bay deep: X from -4 to 4, Z from -2 to 2)
export const DEMO_6_PILLAR_HOUSE_PARTS: PlacedPart[] = [
  ...DEMO_FOUNDATIONS_6,
  // 6 Pillars
  { id: 'p_0', partId: 'pillar_round', name: '기둥 0', category: 'pillar', position: [-4, 1.9, -2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_1', partId: 'pillar_round', name: '기둥 1', category: 'pillar', position: [0, 1.9, -2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_2', partId: 'pillar_round', name: '기둥 2', category: 'pillar', position: [4, 1.9, -2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_3', partId: 'pillar_round', name: '기둥 3', category: 'pillar', position: [4, 1.9, 2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_4', partId: 'pillar_round', name: '기둥 4', category: 'pillar', position: [0, 1.9, 2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },
  { id: 'p_5', partId: 'pillar_round', name: '기둥 5', category: 'pillar', position: [-4, 1.9, 2], rotation: [0, 0, 0], scale: [0.32, 2.8, 0.32] },

  // Beams mortised into pillar capitals (sagae-machum at Y=3.24)
  { id: 'b_n1', partId: 'beam_daedeulbo', name: '대들보 북서', category: 'beam', position: [-2, 3.24, -2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_n2', partId: 'beam_daedeulbo', name: '대들보 북동', category: 'beam', position: [2, 3.24, -2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_s1', partId: 'beam_daedeulbo', name: '대들보 남서', category: 'beam', position: [-2, 3.24, 2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_s2', partId: 'beam_daedeulbo', name: '대들보 남동', category: 'beam', position: [2, 3.24, 2], rotation: [0, 0, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_w', partId: 'beam_daedeulbo', name: '대들보 서측', category: 'beam', position: [-4, 3.24, 0], rotation: [0, Math.PI / 2, 0], scale: [4.0, 0.32, 0.28] },
  { id: 'b_e', partId: 'beam_daedeulbo', name: '대들보 동측', category: 'beam', position: [4, 3.24, 0], rotation: [0, Math.PI / 2, 0], scale: [4.0, 0.32, 0.28] },

  // Walls and Openings
  // North 2 bays: Earth walls
  { id: 'w_n1', partId: 'wall_earth', name: '외엮기 흙벽 N1', category: 'wall', position: [-2, 1.9, -2], rotation: [0, 0, 0], scale: [3.78, 2.8, 0.16] },
  { id: 'w_n2', partId: 'wall_wood', name: '판벽 N2', category: 'wall', position: [2, 1.9, -2], rotation: [0, 0, 0], scale: [3.78, 2.8, 0.16] },
  // South 2 bays: Sliding door & Lattice window
  { id: 'w_s1', partId: 'door_sliding', name: '미닫이문 S1', category: 'door', position: [-2, 1.9, 2], rotation: [0, 0, 0], scale: [3.78, 2.8, 0.16] },
  { id: 'w_s2', partId: 'window_lattice', name: '격자창 S2', category: 'window', position: [2, 1.9, 2], rotation: [0, 0, 0], scale: [3.78, 2.8, 0.16] },
  // West end wall: Traditional door
  { id: 'w_w', partId: 'door_traditional', name: '전통 판문 W', category: 'door', position: [-4, 1.9, 0], rotation: [0, Math.PI / 2, 0], scale: [3.78, 2.8, 0.16] },
  // East end wall: Earth wall
  { id: 'w_e', partId: 'wall_earth', name: '외엮기 흙벽 E', category: 'wall', position: [4, 1.9, 0], rotation: [0, Math.PI / 2, 0], scale: [3.78, 2.8, 0.16] },
];
