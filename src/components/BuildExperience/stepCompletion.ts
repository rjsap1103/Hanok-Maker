import type { PlacedPart } from '../../store/useBuildStore';

export interface StepCompletionStatus {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
}

/**
 * Checks if a specific part in HANOK_PARTS has met its installation requirement
 */
export const isPartCompleted = (
  partId: string,
  placedParts: PlacedPart[],
  hasRoof: boolean
): boolean => {
  switch (partId) {
    case 'foundation_stone':
      return placedParts.filter((p) => p.category === 'foundation' || p.partId === 'foundation_stone').length >= 4;

    case 'pillar_round':
      return placedParts.filter((p) => p.category === 'pillar' || p.partId === 'pillar_round').length >= 4;

    case 'beam_daedeulbo':
      return placedParts.filter((p) => p.category === 'beam' || p.partId === 'beam_daedeulbo').length >= 2;

    case 'wall_earth':
      return placedParts.some((p) => p.partId === 'wall_earth');

    case 'wall_wood':
      return placedParts.some((p) => p.partId === 'wall_wood');

    case 'window_lattice':
      return placedParts.some((p) => p.partId === 'window_lattice');

    case 'door_sliding':
      return placedParts.some((p) => p.partId === 'door_sliding');

    case 'door_traditional':
      return placedParts.some((p) => p.partId === 'door_traditional');

    case 'dori_purin':
      return hasRoof;

    case 'rafter_seokkarae':
      return hasRoof;

    case 'roof_giwa':
      return hasRoof;

    default:
      return false;
  }
};

/**
 * Evaluates whether each step (1 to 5) has met its minimum completion threshold
 */
export const getStepCompletionStatus = (
  placedParts: PlacedPart[],
  hasRoof: boolean
): StepCompletionStatus => {
  const foundations = placedParts.filter((p) => p.category === 'foundation' || p.partId === 'foundation_stone');
  const pillars = placedParts.filter((p) => p.category === 'pillar' || p.partId === 'pillar_round');
  const beams = placedParts.filter((p) => p.category === 'beam' || p.partId === 'beam_daedeulbo');
  const wallsAndOpenings = placedParts.filter(
    (p) => p.category === 'wall' || p.category === 'window' || p.category === 'door'
  );

  return {
    step1: foundations.length >= 4,
    step2: pillars.length >= 4 && beams.length >= 2,
    step3: wallsAndOpenings.length >= 2,
    step4: hasRoof,
    step5: hasRoof,
  };
};
