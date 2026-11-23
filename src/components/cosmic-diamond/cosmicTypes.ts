import type { NavSectionId } from '../../types/domain';

export type CosmicStage =
  | 'idle'
  | 'fracturing'
  | 'orbital'
  | 'reassembling-hero'
  | 'entering-universe'
  | 'universe'
  | 'selecting-shard'
  | 'shard-detail'
  | 'returning-to-universe'
  | 'black-hole-exit'
  | 'reassembling';

/**
 * Canonical 10-phase logical state machine representation across destruction,
 * orbital equilibrium, core supernova, cosmic exploration, and gravitational reassembly.
 */
export type CosmicLogicalPhase =
  | 'DASHBOARD_IDLE'
  | 'DIAMOND_FRACTURING'
  | 'SHARDS_SEPARATING'
  | 'SHARDS_ORBITING'
  | 'CORE_ACTIVATING'
  | 'COSMIC_TRANSITION'
  | 'COSMIC_EXPLORATION'
  | 'REASSEMBLY_ATTRACTION'
  | 'REASSEMBLY_ALIGNMENT'
  | 'REASSEMBLY_HEALING';

// Canonical stage timing constants (shared across state timers & 3D WebGL loops)
export const FRACTURE_TOTAL_DURATION_MS = 4500; // 4.5s (Phase A: 0-1.8s, Phase B: 1.8-3.5s, Phase C: 3.5-4.5s)
export const FRACTURE_REDUCED_DURATION_MS = 1100;
export const FRACTURE_PHASE_A_END_RATIO = 1.8 / 4.5; // 0.400000 (1.8s)
export const FRACTURE_PHASE_B_END_RATIO = 3.5 / 4.5; // 0.777778 (3.5s)

export const SUPERNOVA_TOTAL_DURATION_MS = 2100; // 2.1s (Core Activation -> Radial Wave -> Continuous Cosmic Emergence)
export const SUPERNOVA_REDUCED_DURATION_MS = 650;

export const SELECT_SHARD_DURATION_MS = 560; // 0.56s main approach (within 0.45-0.70s target)
export const SELECT_SHARD_REDUCED_MS = 180;

export const REASSEMBLY_TOTAL_DURATION_MS = 3600; // 3.6s (Phase A: 0-1.5s, Phase B: 1.5-3.1s, Phase C: 3.1-3.6s healing)
export const REASSEMBLY_REDUCED_DURATION_MS = 900;
export const REASSEMBLY_PHASE_A_END_RATIO = 1.5 / 3.6; // 0.416667 (1.5s)
export const REASSEMBLY_PHASE_B_END_RATIO = 3.1 / 3.6; // 0.861111 (3.1s, leaving final 0.5s for Phase C healing)

export const UNIVERSE_EXIT_TO_REASSEMBLE_MS = 540;
export const BLACK_HOLE_EXIT_DURATION_MS = 1650;
export const BLACK_HOLE_EXIT_REDUCED_MS = 500;

/**
 * Maps the current portal stage and normalized progress (0..1) to the exact
 * 10-phase logical state machine phase.
 */
export function resolveCosmicLogicalPhase(
  stage: CosmicStage,
  stageProgress = 0
): CosmicLogicalPhase {
  const p = Math.max(0, Math.min(1, stageProgress));
  switch (stage) {
    case 'idle':
      return 'DASHBOARD_IDLE';
    case 'fracturing':
      if (p < FRACTURE_PHASE_A_END_RATIO) return 'DIAMOND_FRACTURING';
      if (p < FRACTURE_PHASE_B_END_RATIO) return 'SHARDS_SEPARATING';
      return 'SHARDS_ORBITING';
    case 'orbital':
      return 'SHARDS_ORBITING';
    case 'entering-universe':
      return p < 0.56 ? 'CORE_ACTIVATING' : 'COSMIC_TRANSITION';
    case 'universe':
    case 'selecting-shard':
    case 'shard-detail':
    case 'returning-to-universe':
      return 'COSMIC_EXPLORATION';
    case 'black-hole-exit':
    case 'reassembling':
      return 'REASSEMBLY_ATTRACTION';
    case 'reassembling-hero':
      if (p < REASSEMBLY_PHASE_A_END_RATIO) return 'REASSEMBLY_ATTRACTION';
      if (p < REASSEMBLY_PHASE_B_END_RATIO) return 'REASSEMBLY_ALIGNMENT';
      return 'REASSEMBLY_HEALING';
    default:
      return 'DASHBOARD_IDLE';
  }
}

export type CosmicPreviewKind =
  | 'ai-agents'
  | 'world-map'
  | 'academic-roadmap'
  | 'goals-certificates'
  | 'smart-routine'
  | 'admission-intel'
  | 'scholarships'
  | 'financial-planner'
  | 'voice-guide'
  | 'habits-tracker'
  | 'global-rankings'
  | 'university-comparison';

export interface CosmicSectionConfig {
  id: string;
  order: string;
  shardIndex: number;
  title: string;
  subtitle: string;
  category: string;
  accentHex: string;
  secondaryHex: string;
  shortDescription: string;
  purpose: string;
  powerSummary: string;
  solvesProblem: string;
  capabilities: string[];
  targetSection: NavSectionId;
  actionMode: 'navigate' | 'open-audio-guide';
  previewKind: CosmicPreviewKind;
}

export interface CosmicPortalState {
  stage: CosmicStage;
  activeShardId: string | null;
  hoveredShardId: string | null;
  exploredShardIds: string[];
  isCoreHovered: boolean;
  isBlackHoleHovered: boolean;
  coreInsightsOpen: boolean;
  corePulseNonce: number;
  coreRippleNonce: number;
  fractureNonce: number;
}

export type CosmicPortalAction =
  | { type: 'START_FRACTURE' }
  | { type: 'COMPLETE_FRACTURE' }
  | { type: 'START_HERO_REASSEMBLE' }
  | { type: 'SET_CORE_HOVER'; hovered: boolean }
  | { type: 'SET_BLACK_HOLE_HOVER'; hovered: boolean }
  | { type: 'ENTER_UNIVERSE' }
  | { type: 'COMPLETE_ENTER_UNIVERSE' }
  | { type: 'PULSE_COSMIC_CORE' }
  | { type: 'CLOSE_CORE_INSIGHTS' }
  | { type: 'HOVER_SHARD'; shardId: string | null }
  | { type: 'SELECT_SHARD'; shardId: string }
  | { type: 'COMPLETE_SELECT_SHARD' }
  | { type: 'RETURN_TO_UNIVERSE' }
  | { type: 'COMPLETE_RETURN_TO_UNIVERSE' }
  | { type: 'START_BLACK_HOLE_EXIT' }
  | { type: 'COMPLETE_BLACK_HOLE_EXIT' }
  | { type: 'START_REASSEMBLE' }
  | { type: 'COMPLETE_UNIVERSE_REASSEMBLE_EXIT' }
  | { type: 'COMPLETE_REASSEMBLE' }
  | { type: 'FORCE_EXIT_FOR_NAV' };

export const INITIAL_COSMIC_PORTAL_STATE: CosmicPortalState = {
  stage: 'idle',
  activeShardId: null,
  hoveredShardId: null,
  exploredShardIds: [],
  isCoreHovered: false,
  isBlackHoleHovered: false,
  coreInsightsOpen: false,
  corePulseNonce: 0,
  coreRippleNonce: 0,
  fractureNonce: 0,
};

/**
 * Checks whether the full-screen cosmic universe portal overlay should be mounted.
 */
export function isUniverseOverlayStage(stage: CosmicStage): boolean {
  return (
    stage === 'entering-universe' ||
    stage === 'universe' ||
    stage === 'selecting-shard' ||
    stage === 'shard-detail' ||
    stage === 'returning-to-universe' ||
    stage === 'black-hole-exit' ||
    stage === 'reassembling'
  );
}

/**
 * Checks whether a timed transition is currently in flight (used to lock duplicate clicks).
 */
export function isTransitioningStage(stage: CosmicStage): boolean {
  return (
    stage === 'fracturing' ||
    stage === 'reassembling-hero' ||
    stage === 'entering-universe' ||
    stage === 'selecting-shard' ||
    stage === 'returning-to-universe' ||
    stage === 'black-hole-exit' ||
    stage === 'reassembling'
  );
}

/**
 * Returns the previous or next shard ID in cyclic order for keyboard/button stepping.
 */
export function getAdjacentShardId(
  currentId: string | null,
  direction: -1 | 1,
  orderedIds: readonly string[]
): string | null {
  if (orderedIds.length === 0) return null;
  if (!currentId) return orderedIds[0];
  const idx = orderedIds.indexOf(currentId);
  if (idx === -1) return orderedIds[0];
  const nextIdx = (idx + direction + orderedIds.length) % orderedIds.length;
  return orderedIds[nextIdx];
}

/**
 * Picks the next unexplored shard ID (or falls back to the first shard if all are explored).
 */
export function getNextUnexploredShardId(
  exploredIds: readonly string[],
  orderedIds: readonly string[]
): string | null {
  if (orderedIds.length === 0) return null;
  for (const id of orderedIds) {
    if (!exploredIds.includes(id)) return id;
  }
  return orderedIds[0];
}

/**
 * Pure deterministic state machine for the Cosmic Diamond Portal.
 * Enforces strict transition guards so shard selection, cosmic core pulses,
 * and the black hole exit never collide or trigger out of stage.
 */
export function cosmicPortalReducer(
  state: CosmicPortalState,
  action: CosmicPortalAction
): CosmicPortalState {
  switch (action.type) {
    case 'START_FRACTURE': {
      if (state.stage !== 'idle') return state;
      return {
        ...state,
        stage: 'fracturing',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
        fractureNonce: state.fractureNonce + 1,
      };
    }

    case 'COMPLETE_FRACTURE': {
      if (state.stage !== 'fracturing') return state;
      return {
        ...state,
        stage: 'orbital',
      };
    }

    case 'START_HERO_REASSEMBLE': {
      if (state.stage !== 'orbital') return state;
      return {
        ...state,
        stage: 'reassembling-hero',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'SET_CORE_HOVER': {
      if (state.stage !== 'orbital' && state.stage !== 'universe') {
        if (!state.isCoreHovered) return state;
        return { ...state, isCoreHovered: false };
      }
      if (state.isCoreHovered === action.hovered) return state;
      return {
        ...state,
        isCoreHovered: action.hovered,
      };
    }

    case 'SET_BLACK_HOLE_HOVER': {
      if (state.stage !== 'universe') {
        if (!state.isBlackHoleHovered) return state;
        return { ...state, isBlackHoleHovered: false };
      }
      if (state.isBlackHoleHovered === action.hovered) return state;
      return {
        ...state,
        isBlackHoleHovered: action.hovered,
      };
    }

    case 'ENTER_UNIVERSE': {
      if (state.stage !== 'orbital') return state;
      return {
        ...state,
        stage: 'entering-universe',
        isCoreHovered: false,
        isBlackHoleHovered: false,
        hoveredShardId: null,
        coreInsightsOpen: false,
        coreRippleNonce: state.coreRippleNonce + 1,
      };
    }

    case 'COMPLETE_ENTER_UNIVERSE': {
      if (state.stage !== 'entering-universe') return state;
      return {
        ...state,
        stage: 'universe',
      };
    }

    case 'PULSE_COSMIC_CORE': {
      // Strictly isolated to Stage 3/4 cosmic universe — never fires during shard focus or transitions
      if (state.stage !== 'universe') return state;
      return {
        ...state,
        corePulseNonce: state.corePulseNonce + 1,
        coreInsightsOpen: true,
        hoveredShardId: null,
      };
    }

    case 'CLOSE_CORE_INSIGHTS': {
      if (!state.coreInsightsOpen) return state;
      return {
        ...state,
        coreInsightsOpen: false,
      };
    }

    case 'HOVER_SHARD': {
      if (state.stage !== 'universe' && state.stage !== 'orbital') {
        if (state.hoveredShardId === null) return state;
        return { ...state, hoveredShardId: null };
      }
      if (state.hoveredShardId === action.shardId) return state;
      return {
        ...state,
        hoveredShardId: action.shardId,
      };
    }

    case 'SELECT_SHARD': {
      if (state.stage !== 'universe' && state.stage !== 'shard-detail') {
        return state;
      }
      if (state.stage === 'shard-detail' && state.activeShardId === action.shardId) {
        return state;
      }
      const alreadyExplored = state.exploredShardIds.includes(action.shardId);
      const nextExplored = alreadyExplored
        ? state.exploredShardIds
        : [...state.exploredShardIds, action.shardId];

      return {
        ...state,
        stage: 'selecting-shard',
        activeShardId: action.shardId,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
        exploredShardIds: nextExplored,
      };
    }

    case 'COMPLETE_SELECT_SHARD': {
      if (state.stage !== 'selecting-shard') return state;
      return {
        ...state,
        stage: 'shard-detail',
      };
    }

    case 'RETURN_TO_UNIVERSE': {
      if (state.stage !== 'shard-detail' && state.stage !== 'selecting-shard') {
        return state;
      }
      return {
        ...state,
        stage: 'returning-to-universe',
      };
    }

    case 'COMPLETE_RETURN_TO_UNIVERSE': {
      if (state.stage !== 'returning-to-universe') return state;
      return {
        ...state,
        stage: 'universe',
        activeShardId: null,
      };
    }

    case 'START_BLACK_HOLE_EXIT': {
      // Strictly allowed only from main cosmic universe so shard selection cannot accidentally trigger exit
      if (state.stage !== 'universe') return state;
      return {
        ...state,
        stage: 'black-hole-exit',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'COMPLETE_BLACK_HOLE_EXIT': {
      if (state.stage !== 'black-hole-exit') return state;
      // Transition into hero reassembly so all 12 shards smoothly reconstruct the intact Dashboard diamond
      return {
        ...state,
        stage: 'reassembling-hero',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'START_REASSEMBLE': {
      if (
        state.stage === 'idle' ||
        state.stage === 'fracturing' ||
        state.stage === 'reassembling' ||
        state.stage === 'reassembling-hero' ||
        state.stage === 'black-hole-exit'
      ) {
        return state;
      }
      if (state.stage === 'orbital') {
        return {
          ...state,
          stage: 'reassembling-hero',
          activeShardId: null,
          hoveredShardId: null,
          isCoreHovered: false,
          isBlackHoleHovered: false,
          coreInsightsOpen: false,
        };
      }
      return {
        ...state,
        stage: 'reassembling',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'COMPLETE_UNIVERSE_REASSEMBLE_EXIT': {
      if (state.stage !== 'reassembling') return state;
      return {
        ...state,
        stage: 'reassembling-hero',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'COMPLETE_REASSEMBLE': {
      if (state.stage !== 'reassembling' && state.stage !== 'reassembling-hero') {
        return state;
      }
      return {
        ...state,
        stage: 'idle',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    case 'FORCE_EXIT_FOR_NAV': {
      return {
        ...state,
        stage: 'idle',
        activeShardId: null,
        hoveredShardId: null,
        isCoreHovered: false,
        isBlackHoleHovered: false,
        coreInsightsOpen: false,
      };
    }

    default:
      return state;
  }
}
