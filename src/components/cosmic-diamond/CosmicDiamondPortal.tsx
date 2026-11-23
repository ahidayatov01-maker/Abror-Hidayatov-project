import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  BLACK_HOLE_EXIT_DURATION_MS,
  BLACK_HOLE_EXIT_REDUCED_MS,
  cosmicPortalReducer,
  FRACTURE_REDUCED_DURATION_MS,
  FRACTURE_TOTAL_DURATION_MS,
  getAdjacentShardId,
  INITIAL_COSMIC_PORTAL_STATE,
  isUniverseOverlayStage,
  REASSEMBLY_REDUCED_DURATION_MS,
  REASSEMBLY_TOTAL_DURATION_MS,
  resolveCosmicLogicalPhase,
  SELECT_SHARD_DURATION_MS,
  SELECT_SHARD_REDUCED_MS,
  SUPERNOVA_REDUCED_DURATION_MS,
  SUPERNOVA_TOTAL_DURATION_MS,
  UNIVERSE_EXIT_TO_REASSEMBLE_MS,
  type CosmicSectionConfig,
} from './cosmicTypes';
import { COSMIC_SECTIONS, COSMIC_SECTIONS_BY_ID } from './cosmicSections';
import { CrystalFractureScene } from './CrystalFractureScene';
import { CosmicUniverseCanvas } from './CosmicUniverseCanvas';
import { CosmicControls } from './CosmicControls';
import { CosmicInsightsPanel } from './CosmicInsightsPanel';
import { ShardDetailPanel } from './ShardDetailPanel';
import { crystalSoundEngine } from './crystalSoundEngine';
import { getDiamondMicroCopy, getLocalizedShardCopy } from '../../utils/displayCopy';

const ORDERED_SECTION_IDS = COSMIC_SECTIONS.map((s) => s.id);

export const CosmicDiamondPortal: React.FC = () => {
  const { setActiveSection, language } = useApp();
  const { setTutorialSection } = useWorkspaceIntelligence();
  const diamondCopy = getDiamondMicroCopy(language);

  const [state, dispatch] = useReducer(cosmicPortalReducer, INITIAL_COSMIC_PORTAL_STATE);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Track prefers-reduced-motion live
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (ev: MediaQueryListEvent) => setReducedMotion(ev.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Stop any active synthesized audio nodes on unmount
  useEffect(() => {
    return () => {
      crystalSoundEngine.stopAll();
    };
  }, []);

  // Trigger synchronized crystalline healing & gravitational reassembly audio whenever Stage 3 hero reassembly begins
  useEffect(() => {
    if (state.stage === 'reassembling-hero') {
      crystalSoundEngine.playReassemblySequence(reducedMotion);
    }
  }, [state.stage, reducedMotion]);

  // Drive deterministic timed transitions across all stages with guaranteed cleanup
  useEffect(() => {
    let timerId: number | undefined;

    if (state.stage === 'fracturing') {
      // Stage 1 Extended Cinematic Diamond Fracture (6.0s normal / 1.4s reduced):
      // Phase A (0.0–2.5s incipient cracking) -> Phase B (2.5–5.0s separation) -> Phase C (5.0–6.0s orbital formation)
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_FRACTURE' }),
        reducedMotion ? FRACTURE_REDUCED_DURATION_MS : FRACTURE_TOTAL_DURATION_MS
      );
    } else if (state.stage === 'reassembling-hero') {
      // Stage 3 Organic Gravitational Reassembly (3.6s normal / 0.9s reduced):
      // Phase A (0.0–1.5s curved attraction) -> Phase B (1.5–3.1s convergence & alignment) -> Phase C (3.1–3.6s 0.5s crystalline healing)
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_REASSEMBLE' }),
        reducedMotion ? REASSEMBLY_REDUCED_DURATION_MS : REASSEMBLY_TOTAL_DURATION_MS
      );
    } else if (state.stage === 'entering-universe') {
      // Stage 2 4-phase Dashboard Core Supernova: implosion -> shockwave -> burst -> dive (2.85s)
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_ENTER_UNIVERSE' }),
        reducedMotion ? SUPERNOVA_REDUCED_DURATION_MS : SUPERNOVA_TOTAL_DURATION_MS
      );
    } else if (state.stage === 'selecting-shard') {
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_SELECT_SHARD' }),
        reducedMotion ? SELECT_SHARD_REDUCED_MS : SELECT_SHARD_DURATION_MS
      );
    } else if (state.stage === 'returning-to-universe') {
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_RETURN_TO_UNIVERSE' }),
        reducedMotion ? 160 : 360
      );
    } else if (state.stage === 'black-hole-exit') {
      // Stage 5 Black Hole gravitational vortex exit -> hands off to Stage 3 hero reassembly (3.6s)
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_BLACK_HOLE_EXIT' }),
        reducedMotion ? BLACK_HOLE_EXIT_REDUCED_MS : BLACK_HOLE_EXIT_DURATION_MS
      );
    } else if (state.stage === 'reassembling') {
      // Universe pullback exit -> hands off to Stage 3 hero reassembly ('reassembling-hero') on the Dashboard!
      timerId = window.setTimeout(
        () => dispatch({ type: 'COMPLETE_UNIVERSE_REASSEMBLE_EXIT' }),
        reducedMotion ? 260 : UNIVERSE_EXIT_TO_REASSEMBLE_MS
      );
    }

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [state.stage, reducedMotion]);

  const showOverlay = isUniverseOverlayStage(state.stage);

  // Lock page scroll while full-screen Cosmic Universe overlay is active and restore cleanly
  useEffect(() => {
    if (!showOverlay || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [showOverlay]);

  // Keyboard Escape + ArrowLeft/ArrowRight shard stepping across stages
  useEffect(() => {
    if (state.stage === 'idle') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.coreInsightsOpen) {
          e.preventDefault();
          dispatch({ type: 'CLOSE_CORE_INSIGHTS' });
        } else if (state.stage === 'shard-detail' || state.stage === 'selecting-shard') {
          e.preventDefault();
          dispatch({ type: 'RETURN_TO_UNIVERSE' });
        } else if (state.stage === 'universe' || state.stage === 'orbital') {
          e.preventDefault();
          dispatch({ type: 'START_REASSEMBLE' });
        }
        return;
      }

      if (state.stage === 'shard-detail' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const nextId = getAdjacentShardId(state.activeShardId, dir, ORDERED_SECTION_IDS);
        if (nextId) {
          dispatch({ type: 'SELECT_SHARD', shardId: nextId });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.stage, state.activeShardId, state.coreInsightsOpen]);

  const handleFracture = useCallback(() => {
    crystalSoundEngine.playFractureSequence(reducedMotion);
    dispatch({ type: 'START_FRACTURE' });
  }, [reducedMotion]);

  const handleEnterUniverse = useCallback(() => {
    crystalSoundEngine.playCoreSupernovaSequence(reducedMotion);
    dispatch({ type: 'ENTER_UNIVERSE' });
  }, [reducedMotion]);

  const handleHoverShard = useCallback((shardId: string | null) => {
    dispatch({ type: 'HOVER_SHARD', shardId });
  }, []);

  const handleHoverBlackHole = useCallback((hovered: boolean) => {
    dispatch({ type: 'SET_BLACK_HOLE_HOVER', hovered });
  }, []);

  const handleSelectShard = useCallback((shardId: string) => {
    dispatch({ type: 'SELECT_SHARD', shardId });
  }, []);

  const handleStepShard = useCallback(
    (direction: -1 | 1) => {
      const nextId = getAdjacentShardId(state.activeShardId, direction, ORDERED_SECTION_IDS);
      if (nextId) {
        dispatch({ type: 'SELECT_SHARD', shardId: nextId });
      }
    },
    [state.activeShardId]
  );

  const handlePulseCosmicCore = useCallback(() => {
    dispatch({ type: 'PULSE_COSMIC_CORE' });
  }, []);

  const handleCloseCoreInsights = useCallback(() => {
    dispatch({ type: 'CLOSE_CORE_INSIGHTS' });
  }, []);

  const handleStartBlackHoleExit = useCallback(() => {
    dispatch({ type: 'START_BLACK_HOLE_EXIT' });
  }, []);

  const handleReturnToUniverse = useCallback(() => {
    dispatch({ type: 'RETURN_TO_UNIVERSE' });
  }, []);

  const handleReassemble = useCallback(() => {
    dispatch({ type: 'START_REASSEMBLE' });
  }, []);

  const handleReassembleFromStage1 = useCallback(() => {
    dispatch({ type: 'START_HERO_REASSEMBLE' });
  }, []);

  const handleNavigateToSection = useCallback(
    (section: CosmicSectionConfig) => {
      crystalSoundEngine.stopAll();
      dispatch({ type: 'FORCE_EXIT_FOR_NAV' });

      if (section.actionMode === 'open-audio-guide') {
        window.setTimeout(() => {
          setTutorialSection('dashboard');
          const trigger = document.querySelector<HTMLButtonElement>(
            '[data-testid="audio-guide-trigger"]'
          );
          if (trigger) {
            if (trigger.getAttribute('aria-expanded') !== 'true') {
              trigger.click();
            }
          } else {
            setActiveSection(section.targetSection);
          }
        }, 60);
        return;
      }

      setActiveSection(section.targetSection);
    },
    [setActiveSection, setTutorialSection]
  );

  const activeSectionConfig = useMemo(
    () => (state.activeShardId ? COSMIC_SECTIONS_BY_ID[state.activeShardId] || null : null),
    [state.activeShardId]
  );
  const isDetailStage =
    (state.stage === 'selecting-shard' || state.stage === 'shard-detail') &&
    Boolean(activeSectionConfig);

  const universePortal =
    showOverlay && typeof document !== 'undefined'
      ? createPortal(
          <>
            <motion.div
              key="cosmic-universe-portal"
              role="dialog"
              aria-modal="true"
              aria-label="Cosmic Diamond Portal — Global University Intelligence"
              data-testid="cosmic-universe-overlay"
              data-cosmic-stage={state.stage}
              data-cosmic-logical-phase={resolveCosmicLogicalPhase(state.stage)}
              initial={{ opacity: 0 }}
              animate={{
                opacity:
                  state.stage === 'entering-universe'
                    ? 1
                    : state.stage === 'reassembling'
                    ? 0
                    : 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration:
                  state.stage === 'entering-universe'
                    ? reducedMotion
                      ? 0.35
                      : 1.15
                    : reducedMotion
                    ? 0.2
                    : 0.45,
                // Seamless overlapping crossfade from Dashboard core activation (0.0-0.85s) into Cosmic Universe (0.82-1.97s)
                delay:
                  state.stage === 'entering-universe'
                    ? reducedMotion
                      ? 0.22
                      : 0.82
                    : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`fixed inset-0 z-[120] overflow-hidden select-none ${
                state.stage === 'entering-universe' ? 'pointer-events-none' : ''
              }`}
            >
              {/* Full-Screen 3D WebGL Cosmic Universe Canvas */}
              <CosmicUniverseCanvas
                stage={state.stage}
                activeShardId={state.activeShardId}
                hoveredShardId={state.hoveredShardId}
                exploredShardIds={state.exploredShardIds}
                corePulseNonce={state.corePulseNonce}
                isBlackHoleHovered={state.isBlackHoleHovered}
                reducedMotion={reducedMotion}
                onHoverShard={handleHoverShard}
                onHoverBlackHole={handleHoverBlackHole}
                onSelectShard={handleSelectShard}
                onPulseCosmicCore={handlePulseCosmicCore}
                onStartBlackHoleExit={handleStartBlackHoleExit}
                onBackdropReturn={handleReturnToUniverse}
              />

              {/* Top HUD (Progress + Accessibility Fallback Exit) & Bottom 12-Shard Rail */}
              {state.stage !== 'black-hole-exit' && state.stage !== 'entering-universe' && (
                <CosmicControls
                  stage={state.stage}
                  exploredCount={state.exploredShardIds.length}
                  exploredShardIds={state.exploredShardIds}
                  activeShardId={state.activeShardId}
                  hoveredShardId={state.hoveredShardId}
                  onHoverShard={handleHoverShard}
                  onSelectShard={handleSelectShard}
                  onReassemble={handleReassemble}
                />
              )}

              {/* Stage 4: Dismissible "Koinot Tahlili" Panel (grounded 100% in real app data) */}
              <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center sm:justify-end px-4 pt-20 pb-24 sm:px-8">
                <AnimatePresence>
                  {state.stage === 'universe' && state.coreInsightsOpen && (
                    <CosmicInsightsPanel
                      exploredShardIds={state.exploredShardIds}
                      onClose={handleCloseCoreInsights}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Stage 6: Focused Crystal Caption (Left) + Salohiyat Pasporti Glass Panel (Right) */}
              <AnimatePresence mode="wait">
                {isDetailStage && activeSectionConfig && (
                  <div
                    key={`stage3-layout-${activeSectionConfig.id}`}
                    className="pointer-events-none fixed inset-0 z-20 flex flex-col lg:flex-row items-center justify-end lg:justify-between gap-4 px-4 pt-20 pb-5 sm:px-8 lg:px-10 lg:pt-20 lg:pb-8 overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.36, delay: 0.08 }}
                      className="pointer-events-none flex flex-col items-center text-center lg:w-[40%] lg:self-end lg:pb-12 mt-auto lg:mt-0"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-[#0d0926]/85 px-3 py-1 text-[11px] font-mono text-cyan-200 shadow-[0_8px_24px_rgba(6,4,22,0.55)]">
                        {activeSectionConfig.order} / {COSMIC_SECTIONS.length}
                      </span>
                      <h3 className="mt-2 text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(139,92,246,0.65)]">
                        {getLocalizedShardCopy(activeSectionConfig.id, language, activeSectionConfig.title).title}
                      </h3>
                    </motion.div>

                    <ShardDetailPanel
                      section={activeSectionConfig}
                      exploredCount={state.exploredShardIds.length}
                      totalCount={COSMIC_SECTIONS.length}
                      onStepShard={handleStepShard}
                      onNavigateToSection={handleNavigateToSection}
                      onReturnToUniverse={handleReturnToUniverse}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Stage 5: Black Hole Event Horizon Crossing Veil & Caption */}
              <AnimatePresence>
                {state.stage === 'black-hole-exit' && (
                  <>
                    <motion.div
                      key="black-hole-horizon-veil"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.96 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.38 : 1.48, ease: [0.58, 0, 1, 0.42] }}
                      className="pointer-events-none fixed inset-0 z-40"
                      style={{
                        background:
                          'radial-gradient(circle at 72% 34%, rgba(3,2,10,0.99) 0%, rgba(16,8,42,0.92) 45%, rgba(2,1,8,0.98) 100%)',
                      }}
                    />
                    <motion.div
                      key="black-hole-exit-badge"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none fixed bottom-10 inset-x-0 z-50 flex justify-center"
                    >
                      <div className="rounded-full border border-cyan-300/35 bg-[#09061e]/92 px-4 py-1.5 text-xs font-medium text-cyan-100 shadow-[0_0_28px_rgba(139,92,246,0.55)]">
                        {diamondCopy.horizonExiting}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Stage 7 Reassembling Status Micro-Caption */}
              <AnimatePresence>
                {state.stage === 'reassembling' && (
                  <motion.div
                    key="reassembling-badge"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none fixed bottom-10 inset-x-0 z-30 flex justify-center"
                  >
                    <div className="rounded-full border border-violet-300/35 bg-[#0c0824]/90 px-4 py-1.5 text-xs font-medium text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.5)]">
                      {diamondCopy.reassembling}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stage 2 Supernova Translucent Radial Bloom Veil (soft luminous handoff without opaque white/black flash) */}
            <AnimatePresence>
              {state.stage === 'entering-universe' && !reducedMotion && (
                <motion.div
                  key="supernova-entry-veil"
                  data-testid="supernova-light-veil"
                  initial={{ opacity: 0, scale: 1.0 }}
                  animate={{
                    opacity: [0, 0, 0.22, 0.68, 0.28, 0],
                    scale: [1.0, 1.05, 1.14, 1.24, 1.36, 1.48],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2.08,
                    times: [0, 0.28, 0.42, 0.56, 0.78, 1.0],
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none fixed -inset-[30%] z-[125]"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 45%, rgba(240,249,255,0.88) 0%, rgba(125,211,252,0.68) 18%, rgba(168,85,247,0.34) 36%, rgba(8,6,26,0) 56%)',
                  }}
                />
              )}
            </AnimatePresence>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <CrystalFractureScene
        stage={state.stage}
        reducedMotion={reducedMotion}
        onFracture={handleFracture}
        onEnterUniverse={handleEnterUniverse}
        onReassembleFromStage1={handleReassembleFromStage1}
      />
      {universePortal}
    </>
  );
};
