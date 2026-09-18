export interface PartData {
  id: string;
  name: string;
  category: 'foundation' | 'pillar' | 'beam' | 'wall' | 'window' | 'door' | 'rafter' | 'roof';
  step: number;
  material: string;
  style: string;
  dimensions: string;
  description: string;
}

export const HANOK_PARTS: PartData[] = [
  // STEP 1
  {
    id: 'foundation_stone',
    name: '장대석 기단 (Foundation)',
    category: 'foundation',
    step: 1,
    material: '자연 화강암 (Granite Stone)',
    style: '조선 전기 궁궐/사대부 가구식 기단',
    dimensions: '6.0m × 4.0m × 0.6m',
    description: '습기를 막고 지반을 견고히 다지는 한옥의 기초 단층입니다.',
  },
  {
    id: 'floor_wood',
    name: '바닥 생성 (Floor Construction)',
    category: 'foundation',
    step: 1,
    material: '우물마루 / 온돌 / 흙바닥',
    style: '모듈형 전통 마루 가구식 바닥',
    dimensions: '주춧돌 배치 구역 맞춤 자동 연산',
    description: '배치된 주춧돌 구역을 따라 한옥의 전통 마루 및 온돌 바닥을 형성합니다.',
  },
  // STEP 2
  {
    id: 'pillar_round',
    name: '두리기둥 (Round Pillar)',
    category: 'pillar',
    step: 2,
    material: '육송 / 금강소나무 (Korean Red Pine)',
    style: '민흘림 (Tapered Classical)',
    dimensions: '직경 0.28m × 높이 2.8m',
    description: '자연스런 나무의 결을 살려 지붕의 하중을 초석으로 전달합니다.',
  },
  {
    id: 'beam_daedeulbo',
    name: '대들보 (Main Beam)',
    category: 'beam',
    step: 2,
    material: '고령 소나무 (Cured Pine Timber)',
    style: '오량가 맞춤 결구 (5-beam Truss)',
    dimensions: '길이 5.4m × 폭 0.45m',
    description: '전후면 평주 위에 가로질러 지붕의 전체 구조를 지탱하는 핵심 뼈대입니다.',
  },
  // STEP 3: Walls & Openings
  {
    id: 'wall_earth',
    name: '외엮기 흙벽 (Earth Wall)',
    category: 'wall',
    step: 3,
    material: '황토 + 짚 + 닥풀 (Rammed Earth & Straw)',
    style: '숨쉬는 전통 회벽 마감',
    dimensions: '두께 0.16m × 높이 2.5m',
    description: '기둥과 기둥 사이에 외를 엮고 황토를 바른 통기성 천연 흙벽입니다.',
  },
  {
    id: 'wall_wood',
    name: '판벽 (Wood Wall)',
    category: 'wall',
    step: 3,
    material: '참나무/소나무 판재 (Wood Planks)',
    style: '세로 널빤지 가공 벽체',
    dimensions: '두께 0.08m × 높이 2.5m',
    description: '나뭇결의 따스함과 견고한 차음성을 제공하는 전통 판자벽입니다.',
  },
  {
    id: 'window_lattice',
    name: '세살 격자창 (Lattice Window)',
    category: 'window',
    step: 3,
    material: '전통 한지 + 춘양목 창살',
    style: '완자살 / 세살격자',
    dimensions: '폭 1.4m × 높이 1.6m',
    description: '벽체 위치에 맞춤 설치되어 은은한 한지 투과광을 연출합니다.',
  },
  {
    id: 'door_sliding',
    name: '미닫이 세살문 (Sliding Door)',
    category: 'door',
    step: 3,
    material: '소나무 + 백호지 한지',
    style: '2짝 슬라이딩 미닫이문',
    dimensions: '폭 1.6m × 높이 2.2m',
    description: '좌우로 미끄러져 열리며 공간을 유연하게 확장 및 분할합니다.',
  },
  {
    id: 'door_traditional',
    name: '전통 띠살 판문 (Traditional Door)',
    category: 'door',
    step: 3,
    material: '느티나무 + 무쇠 장석 힌지',
    style: '궁판 딸린 띠살 여닫이문',
    dimensions: '폭 1.2m × 높이 2.2m',
    description: '중후한 전통 경첩 장석이 결합된 견고한 여닫이 전통 목문입니다.',
  },
  // STEP 4: Roof Structure & Tiles (지붕 가구 골조 및 기와)
  {
    id: 'dori_purin',
    name: '주심도리 및 종도리 (Purlin / Dori)',
    category: 'beam',
    step: 4,
    material: '고령 소나무 원목 (Cured Pine Timber)',
    style: '굴도리 / 통나무 도리 결구',
    dimensions: '직경 0.24m × 건물 전장 폭',
    description: '대들보 위와 기둥 머리에서 서까래를 수평으로 받쳐주는 전통 가구 부재입니다.',
  },
  {
    id: 'rafter_seokkarae',
    name: '서까래 (Rafter Structure)',
    category: 'rafter',
    step: 4,
    material: '원목 연목 (Round Timber Rafter)',
    style: '부연 달린 겹처마 (Double Eaves)',
    dimensions: '길이 3.2m (배열 피치 30cm)',
    description: '처마의 유려한 상승 곡선을 형성하는 서까래 열입니다.',
  },
  {
    id: 'roof_giwa',
    name: '전통 흑회색 기와 (Black Giwa Tiles)',
    category: 'roof',
    step: 5,
    material: '구운 점토 기와 (Fired Clay Tile)',
    style: '팔작지붕 (Paljak Hip-and-Gable)',
    dimensions: '수키와/암키와 결합 곡면',
    description: '한국 전통 건축의 정점인 우아한 곡선미와 방수 성능을 완성합니다.',
  },
];
