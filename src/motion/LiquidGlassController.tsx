import React, { useEffect } from 'react';
import {
  classifyGlassPerfTier,
  DEFAULT_REST_LIGHTING,
  stepLightingVector,
  type LightingVector,
} from './lightingMath';

export const GLASS_INTERACTIVE_SELECTOR = [
  '.glass-surface',
  '.glass-panel',
  '.surface-card',
  '.surface-subtle',
  '.btn-primary',
  '.btn-glass',
  '.glass-input',
  '.glass-segmented',
  '.glass-interactive',
  '.motion-interactive-card',
  '[data-glass-surface="true"]',
].join(', ');

interface TrackedSurfaceState {
  current: LightingVector;
  target: LightingVector;
  active: boolean;
  rect: DOMRect | null;
  rectVersion: number;
}

/**
 * Global, zero-React-rerender 60/120fps Liquid Glass Lighting Controller.
 *
 * - Smoothly interpolates `--lg-x`, `--lg-y`, and `--lg-opacity` using dt-independent
 *   exponential smoothing (`stepLightingVector`) so glass highlights glide fluidly.
 * - Caches element `DOMRect` per scroll/resize layout epoch instead of calling
 *   `getBoundingClientRect()` on every pointermove animation frame.
 * - Automatically pauses `requestAnimationFrame` as soon as all active surfaces settle
 *   (0% idle CPU/GPU cost).
 * - Monitors visibility with `IntersectionObserver` so off-screen surfaces skip updates.
 */
export const LiquidGlassController: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const root = document.documentElement;
    const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointerMq = window.matchMedia('(pointer: coarse)');
    const hoverMq = window.matchMedia('(hover: hover)');

    const updateCapabilityTier = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const tier = classifyGlassPerfTier({
        prefersReducedMotion: reducedMotionMq.matches,
        hasCoarsePointer: coarsePointerMq.matches,
        canHover: hoverMq.matches,
        deviceMemoryGb: nav.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      });
      root.dataset.glassPerf = tier;
      return tier;
    };

    let currentTier = updateCapabilityTier();

    const surfaceMap = new WeakMap<HTMLElement, TrackedSurfaceState>();
    const activeSurfaces = new Set<HTMLElement>();
    let hoveredSurface: HTMLElement | null = null;
    let rafId: number | null = null;
    let lastFrameTs = 0;
    let layoutVersion = 1;

    const writeElementCssVars = (el: HTMLElement, vec: LightingVector) => {
      el.style.setProperty('--lg-x', `${vec.x.toFixed(2)}%`);
      el.style.setProperty('--lg-y', `${vec.y.toFixed(2)}%`);
      el.style.setProperty('--lg-opacity', vec.opacity.toFixed(3));
    };

    const getOrCreateState = (el: HTMLElement): TrackedSurfaceState => {
      let state = surfaceMap.get(el);
      if (!state) {
        state = {
          current: { ...DEFAULT_REST_LIGHTING },
          target: { ...DEFAULT_REST_LIGHTING },
          active: false,
          rect: null,
          rectVersion: -1,
        };
        surfaceMap.set(el, state);
      }
      return state;
    };

    const ensureLoopRunning = () => {
      if (rafId !== null || activeSurfaces.size === 0) return;
      if (currentTier === 'reduced' || (coarsePointerMq.matches && !hoverMq.matches)) return;
      lastFrameTs = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    const deactivateSurface = (el: HTMLElement | null) => {
      if (!el) return;
      const state = surfaceMap.get(el);
      if (!state) return;
      state.active = false;
      state.target = { ...DEFAULT_REST_LIGHTING };
      activeSurfaces.add(el);
      ensureLoopRunning();
    };

    const tick = (now: number) => {
      rafId = null;
      const dtMs = lastFrameTs > 0 ? now - lastFrameTs : 16.67;
      lastFrameTs = now;

      const speedPerSec = currentTier === 'high' ? 11.2 : 9.0;

      for (const el of Array.from(activeSurfaces)) {
        if (!el.isConnected || el.dataset.glassOffscreen === 'true') {
          activeSurfaces.delete(el);
          continue;
        }
        const state = surfaceMap.get(el);
        if (!state) {
          activeSurfaces.delete(el);
          continue;
        }

        const { next, settled } = stepLightingVector(state.current, state.target, dtMs, speedPerSec);
        state.current = next;
        writeElementCssVars(el, next);

        if (settled && !state.active) {
          activeSurfaces.delete(el);
        } else if (settled && state.active) {
          // Keep target settled cleanly without continuing rAF until next pointer move
          activeSurfaces.delete(el);
        }
      }

      if (activeSurfaces.size > 0) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const isEligibleSurface = (node: EventTarget | null): HTMLElement | null => {
      if (!(node instanceof Element)) return null;
      if (node.closest('.paper-journal-surface, [data-glass-static="true"]')) return null;
      const candidate = node.closest(GLASS_INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!candidate) return null;
      if (candidate.closest('.paper-journal-surface, [data-glass-static="true"]')) return null;
      return candidate;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (currentTier === 'reduced') return;
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (coarsePointerMq.matches && !hoverMq.matches) return;

      const glassEl = isEligibleSurface(e.target);

      if (hoveredSurface && hoveredSurface !== glassEl) {
        deactivateSurface(hoveredSurface);
      }
      hoveredSurface = glassEl;

      if (!glassEl || glassEl.dataset.glassOffscreen === 'true') return;

      const state = getOrCreateState(glassEl);
      if (state.rect === null || state.rectVersion !== layoutVersion) {
        state.rect = glassEl.getBoundingClientRect();
        state.rectVersion = layoutVersion;
      }

      const rect = state.rect;
      if (rect.width <= 0 || rect.height <= 0) return;

      const pctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const pctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      state.active = true;
      state.target = {
        x: pctX,
        y: pctY,
        opacity: 1.0,
      };

      activeSurfaces.add(glassEl);
      ensureLoopRunning();
    };

    const onPointerLeaveWindow = () => {
      if (hoveredSurface) {
        deactivateSurface(hoveredSurface);
        hoveredSurface = null;
      }
    };

    const invalidateLayout = () => {
      layoutVersion += 1;
    };

    // IntersectionObserver viewport culling for larger panels & cards
    let io: IntersectionObserver | null = null;
    const observedSet = new WeakSet<Element>();

    const scanGlassElements = () => {
      if (!io) return;
      const nodes = document.querySelectorAll('.surface-card, .glass-panel, [data-glass-surface="true"]');
      nodes.forEach((el) => {
        if (!observedSet.has(el)) {
          observedSet.add(el);
          io!.observe(el);
        }
      });
    };

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              if (target.dataset.glassOffscreen) {
                delete target.dataset.glassOffscreen;
              }
            } else {
              target.dataset.glassOffscreen = 'true';
              activeSurfaces.delete(target);
            }
          }
        },
        { rootMargin: '120px 0px' }
      );
      scanGlassElements();
    }

    let moTimer: number | null = null;
    const mo =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (moTimer !== null) return;
            moTimer = window.setTimeout(() => {
              moTimer = null;
              invalidateLayout();
              scanGlassElements();
            }, 180);
          })
        : null;

    mo?.observe(document.body, { childList: true, subtree: true });

    const onCapabilityChange = () => {
      currentTier = updateCapabilityTier();
      if (currentTier === 'reduced' && rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
        activeSurfaces.clear();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeaveWindow, { passive: true });
    window.addEventListener('blur', onPointerLeaveWindow, { passive: true });
    window.addEventListener('scroll', invalidateLayout, { passive: true, capture: true });
    window.addEventListener('resize', invalidateLayout, { passive: true });
    reducedMotionMq.addEventListener?.('change', onCapabilityChange);
    coarsePointerMq.addEventListener?.('change', onCapabilityChange);
    hoverMq.addEventListener?.('change', onCapabilityChange);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeaveWindow);
      window.removeEventListener('blur', onPointerLeaveWindow);
      window.removeEventListener('scroll', invalidateLayout, { capture: true });
      window.removeEventListener('resize', invalidateLayout);
      reducedMotionMq.removeEventListener?.('change', onCapabilityChange);
      coarsePointerMq.removeEventListener?.('change', onCapabilityChange);
      hoverMq.removeEventListener?.('change', onCapabilityChange);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (moTimer !== null) window.clearTimeout(moTimer);
      io?.disconnect();
      mo?.disconnect();
    };
  }, []);

  return null;
};
