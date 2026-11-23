export type GlassPerfTier = 'high' | 'balanced' | 'reduced';

export interface LightingVector {
  x: number;
  y: number;
  opacity: number;
}

export interface DeviceCapabilityHints {
  prefersReducedMotion: boolean;
  hasCoarsePointer: boolean;
  canHover: boolean;
  deviceMemoryGb?: number;
  hardwareConcurrency?: number;
}

export const DEFAULT_REST_LIGHTING: LightingVector = {
  x: 34,
  y: 12,
  opacity: 0.42,
};

export function clampPercent(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Frame-rate independent exponential smoothing factor:
 * factor = 1 - exp(-speed * dtSeconds)
 * Guarantees identical visual motion curves on 60Hz, 120Hz, and variable displays.
 */
export function computeExpSmoothingFactor(dtMs: number, speedPerSec = 10.5): number {
  const clampedDtSec = Math.max(0.001, Math.min(0.05, dtMs / 1000));
  return 1 - Math.exp(-speedPerSec * clampedDtSec);
}

/**
 * Steps current lighting state toward target using exponential smoothing.
 * Reports `settled: true` when all components are within threshold so the rAF loop
 * can cleanly shut down and consume 0% CPU/GPU while idle.
 */
export function stepLightingVector(
  current: LightingVector,
  target: LightingVector,
  dtMs: number,
  speedPerSec = 10.5,
  epsilon = 0.08
): { next: LightingVector; settled: boolean } {
  const alphaPos = computeExpSmoothingFactor(dtMs, speedPerSec);
  const alphaOpacity = computeExpSmoothingFactor(dtMs, speedPerSec * 0.78);

  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dOpacity = target.opacity - current.opacity;

  const isSettled =
    Math.abs(dx) <= epsilon &&
    Math.abs(dy) <= epsilon &&
    Math.abs(dOpacity) <= 0.005;

  if (isSettled) {
    return {
      next: {
        x: clampPercent(target.x),
        y: clampPercent(target.y),
        opacity: Math.max(0, Math.min(1, target.opacity)),
      },
      settled: true,
    };
  }

  return {
    next: {
      x: clampPercent(current.x + dx * alphaPos),
      y: clampPercent(current.y + dy * alphaPos),
      opacity: Math.max(0, Math.min(1, current.opacity + dOpacity * alphaOpacity)),
    },
    settled: false,
  };
}

export function classifyGlassPerfTier(hints: DeviceCapabilityHints): GlassPerfTier {
  if (hints.prefersReducedMotion) return 'reduced';
  if (hints.hasCoarsePointer && !hints.canHover) return 'balanced';
  if (typeof hints.deviceMemoryGb === 'number' && hints.deviceMemoryGb > 0 && hints.deviceMemoryGb <= 2) {
    return 'balanced';
  }
  if (
    typeof hints.hardwareConcurrency === 'number' &&
    hints.hardwareConcurrency > 0 &&
    hints.hardwareConcurrency <= 2
  ) {
    return 'balanced';
  }
  return 'high';
}
