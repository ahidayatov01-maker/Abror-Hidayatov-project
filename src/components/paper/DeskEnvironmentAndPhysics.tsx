import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type {
  DeskSurfaceTheme,
  LightingTheme,
  TornPaperObject,
  WritingInstrument,
} from '../../types/journal';
import { advanceCrumpleStage, stepThrowPhysics } from '../../utils/journalEngine';
import { paperAudio } from '../../utils/paperAudio';

export const DESK_THEMES: Record<
  DeskSurfaceTheme,
  { label: string; baseColor: string; background: string; grainColor: string }
> = {
  walnut: {
    label: 'Warm Walnut',
    baseColor: '#3E2718',
    background:
      'radial-gradient(ellipse at 30% 15%, #5C3D28 0%, #3E2718 55%, #27170D 100%)',
    grainColor: 'rgba(18, 9, 3, 0.14)',
  },
  slate: {
    label: 'Architect Slate',
    baseColor: '#242931',
    background:
      'radial-gradient(ellipse at 35% 15%, #373D47 0%, #242931 58%, #161A20 100%)',
    grainColor: 'rgba(255, 255, 255, 0.03)',
  },
  linen: {
    label: 'Studio Linen',
    baseColor: '#CEC4B2',
    background:
      'radial-gradient(ellipse at 35% 18%, #DFD7C8 0%, #CEC4B2 60%, #B8AD99 100%)',
    grainColor: 'rgba(80, 68, 52, 0.07)',
  },
  pine: {
    label: 'Natural Pine',
    baseColor: '#A98456',
    background:
      'radial-gradient(ellipse at 30% 18%, #C4A277 0%, #A98456 58%, #87653C 100%)',
    grainColor: 'rgba(65, 42, 18, 0.12)',
  },
};

export const LIGHTING_OVERLAYS: Record<
  LightingTheme,
  { label: string; overlay: string }
> = {
  morning: {
    label: 'Morning Window',
    overlay:
      'linear-gradient(125deg, rgba(255, 248, 228, 0.22) 0%, rgba(255, 240, 200, 0.06) 45%, rgba(15, 20, 32, 0.18) 100%)',
  },
  lamp: {
    label: 'Warm Desk Lamp',
    overlay:
      'radial-gradient(circle at 72% 18%, rgba(255, 224, 158, 0.28) 0%, rgba(255, 196, 110, 0.08) 42%, rgba(12, 10, 8, 0.36) 100%)',
  },
  evening: {
    label: 'Evening Study',
    overlay:
      'radial-gradient(circle at 50% 35%, rgba(215, 225, 255, 0.08) 0%, rgba(10, 14, 26, 0.38) 100%)',
  },
  daylight: {
    label: 'Clear Daylight',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.05) 100%)',
  },
};

const CrumpledPaperVisual: React.FC<{ obj: TornPaperObject }> = ({ obj }) => {
  const stage = obj.crumpleStage;

  if (stage === 0) {
    // Torn flat/slightly curled paper sheet with organic top fiber tear
    return (
      <div className="w-40 rounded-b-md bg-[#FAF4E4] text-[#2B241B] p-3 shadow-xl border border-amber-950/15 relative">
        <svg
          viewBox="0 0 160 12"
          className="absolute -top-2.5 left-0 w-full h-3"
          preserveAspectRatio="none"
        >
          <path
            d="M0,12 L0,6 L14,2 L28,8 L45,1 L62,7 L78,2 L96,8 L112,3 L128,7 L145,2 L160,6 L160,12 Z"
            fill="#FAF4E4"
          />
        </svg>
        <p className="font-hw-caveat text-base font-semibold truncate">{obj.title}</p>
        <p className="font-hw-kalam text-[11px] text-[#5B5245] line-clamp-2 mt-0.5">
          {obj.snippet || 'Torn notebook page'}
        </p>
        <p className="text-[10px] text-[#8C7B63] mt-2">Click to crumple · Drag to throw</p>
      </div>
    );
  }

  if (stage <= 2) {
    // Folded / deeply creased intermediate polygon sheet
    return (
      <div
        className="w-32 h-24 relative drop-shadow-xl"
        style={{
          clipPath:
            stage === 1
              ? 'polygon(4% 6%, 94% 2%, 98% 92%, 8% 96%)'
              : 'polygon(10% 4%, 88% 12%, 94% 84%, 14% 94%)',
          background:
            'linear-gradient(135deg, #FAF4E4 0%, #E7DCC2 48%, #FAF4E4 52%, #DFD1B2 100%)',
        }}
      >
        <div className="p-2.5">
          <p className="font-hw-caveat text-sm text-[#352E24] truncate">{obj.title}</p>
          <p className="text-[10px] text-[#7D6E59] mt-1">
            Stage {stage}/4 · Click again
          </p>
        </div>
      </div>
    );
  }

  // Stage 3 or 4: Multi-faceted crumpled paper ball SVG with crease shadows
  const size = stage === 3 ? 64 : 52;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="drop-shadow-[0_10px_14px_rgba(15,10,6,0.34)]"
    >
      <polygon
        points="16,8 36,4 54,14 60,34 48,54 24,58 8,44 6,24"
        fill="#F4ECD7"
        stroke="#C5B698"
        strokeWidth="1.2"
      />
      <polygon points="16,8 36,4 32,28 14,26" fill="#FAF5E8" />
      <polygon points="36,4 54,14 44,32 32,28" fill="#E3D5B7" />
      <polygon points="32,28 44,32 48,54 24,58" fill="#D8C7A4" />
      <polygon points="14,26 32,28 24,58 8,44" fill="#EDE2C8" />
      <path
        d="M 14 26 L 32 28 L 54 14 M 32 28 L 48 54 M 36 4 L 32 28 L 8 44"
        stroke="#9A896E"
        strokeWidth="0.9"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
};

export const DeskEnvironmentLayer: React.FC<{
  deskTheme: DeskSurfaceTheme;
  lightingTheme: LightingTheme;
  showDeskObjects: boolean;
  activeTool: 'type' | 'draw' | 'erase';
  instrument: WritingInstrument;
  tornObjects: TornPaperObject[];
  onSelectInstrument: (inst: WritingInstrument, mode?: 'type' | 'draw' | 'erase') => void;
  onUpdateTornObjects: (updater: (prev: TornPaperObject[]) => TornPaperObject[]) => void;
  onRestoreTornPage: (pageId: string) => void;
  onOpenArchiveDrawer: () => void;
  children: React.ReactNode;
}> = ({
  deskTheme,
  lightingTheme,
  showDeskObjects,
  activeTool,
  instrument,
  tornObjects,
  onSelectInstrument,
  onUpdateTornObjects,
  onRestoreTornPage,
  onOpenArchiveDrawer,
  children,
}) => {
  const deskRef = useRef<HTMLDivElement | null>(null);
  const basketRef = useRef<HTMLButtonElement | null>(null);
  const [basketShake, setBasketShake] = useState(false);

  // Dragging / throw velocity tracking
  const dragInfoRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
    samples: Array<{ x: number; y: number; t: number }>;
  } | null>(null);

  const tornRef = useRef(tornObjects);
  tornRef.current = tornObjects;

  const getBounds = () => {
    const deskRect = deskRef.current?.getBoundingClientRect();
    const basketRect = basketRef.current?.getBoundingClientRect();
    const width = deskRect?.width || 1100;
    const height = deskRect?.height || 760;
    const wastebasket =
      deskRect && basketRect
        ? {
            x: basketRect.left - deskRect.left + basketRect.width / 2,
            y: basketRect.top - deskRect.top + basketRect.height / 2,
            radius: 58,
          }
        : { x: width - 78, y: height - 78, radius: 58 };
    return { width, height, wastebasket };
  };

  // Run physics RAF only while at least one object is flying
  const hasFlying = tornObjects.some((o) => o.state === 'flying');
  useEffect(() => {
    if (!hasFlying) return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      const bounds = getBounds();
      let landedAny = false;
      let hitBasketAny = false;

      onUpdateTornObjects((prev) =>
        prev.map((obj) => {
          if (obj.state !== 'flying') return obj;
          const next = stepThrowPhysics(obj, dt, bounds);
          if (next.state === 'archived' && !obj.inWastebasket) {
            hitBasketAny = true;
            landedAny = true;
          } else if (next.state === 'landed') {
            landedAny = true;
          }
          return next;
        })
      );

      if (landedAny) {
        paperAudio.playPaperLand(hitBasketAny);
        if (hitBasketAny) {
          setBasketShake(true);
          setTimeout(() => setBasketShake(false), 360);
        }
      }

      if (tornRef.current.some((o) => o.state === 'flying')) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasFlying, onUpdateTornObjects]);

  const handleObjectPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    obj: TornPaperObject
  ) => {
    e.stopPropagation();
    const deskRect = deskRef.current?.getBoundingClientRect();
    if (!deskRect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const localX = e.clientX - deskRect.left;
    const localY = e.clientY - deskRect.top;

    dragInfoRef.current = {
      id: obj.id,
      offsetX: localX - obj.x,
      offsetY: localY - obj.y,
      startX: localX,
      startY: localY,
      moved: false,
      samples: [{ x: localX, y: localY, t: performance.now() }],
    };

    onUpdateTornObjects((prev) =>
      prev.map((item) => (item.id === obj.id ? { ...item, state: 'held', vx: 0, vy: 0 } : item))
    );
  };

  const handleObjectPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info) return;
    const deskRect = deskRef.current?.getBoundingClientRect();
    if (!deskRect) return;

    const localX = e.clientX - deskRect.left;
    const localY = e.clientY - deskRect.top;
    if (Math.hypot(localX - info.startX, localY - info.startY) > 6) {
      info.moved = true;
    }
    const now = performance.now();
    info.samples = [...info.samples.slice(-5), { x: localX, y: localY, t: now }];

    const nx = Math.max(24, Math.min(deskRect.width - 40, localX - info.offsetX));
    const ny = Math.max(24, Math.min(deskRect.height - 40, localY - info.offsetY));

    onUpdateTornObjects((prev) =>
      prev.map((item) =>
        item.id === info.id ? { ...item, x: nx, y: ny, state: 'dragging' } : item
      )
    );
  };

  const handleObjectPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    obj: TornPaperObject
  ) => {
    const info = dragInfoRef.current;
    if (!info || info.id !== obj.id) return;
    dragInfoRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if not captured
    }

    if (!info.moved) {
      // Click -> advance progressive crumple stage!
      const nextStage = advanceCrumpleStage(obj.crumpleStage);
      paperAudio.playFoldOrCrumple(nextStage);
      onUpdateTornObjects((prev) =>
        prev.map((item) =>
          item.id === obj.id
            ? {
                ...item,
                crumpleStage: nextStage,
                state: nextStage >= 2 ? 'crumpled' : 'folded',
              }
            : item
        )
      );
      return;
    }

    // Compute pointer throw velocity from recent samples
    const recent = info.samples;
    let vx = 0;
    let vy = 0;
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = Math.max(0.016, (last.t - first.t) / 1000);
      vx = ((last.x - first.x) / dt) * 0.85;
      vy = ((last.y - first.y) / dt) * 0.85;
    }

    const speed = Math.hypot(vx, vy);
    const bounds = getBounds();
    const inBasketNow =
      Math.hypot(obj.x - bounds.wastebasket.x, obj.y - bounds.wastebasket.y) <=
      bounds.wastebasket.radius;

    if (inBasketNow) {
      paperAudio.playPaperLand(true);
      setBasketShake(true);
      setTimeout(() => setBasketShake(false), 360);
      onUpdateTornObjects((prev) =>
        prev.map((item) =>
          item.id === obj.id
            ? { ...item, state: 'archived', inWastebasket: true, vx: 0, vy: 0 }
            : item
        )
      );
      return;
    }

    if (speed > 120) {
      onUpdateTornObjects((prev) =>
        prev.map((item) =>
          item.id === obj.id
            ? {
                ...item,
                vx: Math.max(-1400, Math.min(1400, vx)),
                vy: Math.max(-1400, Math.min(1400, vy)),
                angularVelocity: (vx >= 0 ? 1 : -1) * Math.min(480, speed * 0.45),
                state: 'flying',
              }
            : item
        )
      );
    } else {
      paperAudio.playPaperLand(false);
      onUpdateTornObjects((prev) =>
        prev.map((item) =>
          item.id === obj.id ? { ...item, state: 'landed', vx: 0, vy: 0 } : item
        )
      );
    }
  };

  const desk = DESK_THEMES[deskTheme] || DESK_THEMES.walnut;
  const lighting = LIGHTING_OVERLAYS[lightingTheme] || LIGHTING_OVERLAYS.morning;
  const activeDeskPapers = tornObjects.filter((o) => !o.inWastebasket);
  const basketCount = tornObjects.filter((o) => o.inWastebasket).length;

  return (
    <div
      ref={deskRef}
      className="relative rounded-3xl overflow-hidden border border-black/15 min-h-[620px] sm:min-h-[680px] p-2 sm:p-6 lg:p-10 transition-colors duration-300"
      style={{ backgroundColor: desk.baseColor, backgroundImage: desk.background }}
    >
      {/* Subtle desk grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(92deg, transparent, transparent 42px, ${desk.grainColor} 43px, transparent 45px)`,
        }}
      />

      {/* Ambient lighting & directional falloff */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ background: lighting.overlay }}
      />

      {/* Restrained Stationery Objects on Desk Periphery (hidden on small screens to protect space) */}
      {showDeskObjects && (
        <>
          {/* Left-edge interactive pens & pencil */}
          <div className="hidden xl:flex flex-col gap-3 absolute left-4 top-24 z-20">
            <button
              type="button"
              onClick={() => onSelectInstrument('fountain', 'type')}
              title="Select Fountain Pen"
              aria-label="Desk fountain pen"
              className={`group p-1 rounded-lg transition-transform cursor-pointer ${
                instrument === 'fountain' && activeTool !== 'erase'
                  ? 'translate-x-2'
                  : 'hover:translate-x-1 opacity-85'
              }`}
            >
              <svg width="26" height="128" viewBox="0 0 26 128" className="drop-shadow-lg">
                <rect x="8" y="28" width="10" height="84" rx="4" fill="#1C2638" />
                <rect x="11" y="34" width="2" height="72" rx="1" fill="rgba(255,255,255,0.22)" />
                <rect x="7" y="42" width="12" height="4" fill="#D4AF37" />
                <polygon points="8,28 18,28 13,4" fill="#D8C27A" />
                <line x1="13" y1="4" x2="13" y2="20" stroke="#1C2638" strokeWidth="1" />
                <rect x="9" y="112" width="8" height="10" rx="2" fill="#D4AF37" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onSelectInstrument('pencil', 'draw')}
              title="Select Graphite Pencil (Draw mode)"
              aria-label="Desk wooden pencil"
              className={`group p-1 rounded-lg transition-transform cursor-pointer ${
                instrument === 'pencil'
                  ? 'translate-x-2'
                  : 'hover:translate-x-1 opacity-85'
              }`}
            >
              <svg width="24" height="114" viewBox="0 0 24 114" className="drop-shadow-lg">
                <rect x="8" y="22" width="8" height="76" fill="#D99B38" />
                <rect x="11" y="22" width="2" height="76" fill="#C48422" />
                <polygon points="8,22 16,22 12,4" fill="#F0D8B4" />
                <polygon points="10.5,11 13.5,11 12,4" fill="#36393F" />
                <rect x="8" y="98" width="8" height="4" fill="#B8BEC6" />
                <rect x="8" y="102" width="8" height="8" rx="2" fill="#D98A82" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onSelectInstrument(instrument, 'erase')}
              title="Select Rubber Eraser"
              aria-label="Desk rubber eraser"
              className={`p-1 rounded-lg transition-transform cursor-pointer ${
                activeTool === 'erase' ? 'translate-x-2' : 'hover:translate-x-1 opacity-85'
              }`}
            >
              <div className="w-6 h-10 rounded-sm bg-gradient-to-b from-[#EDE7DD] via-[#EDE7DD] to-[#5B758A] shadow-md border border-black/15" />
            </button>
          </div>

          {/* Right-edge Brass Ruler & Coffee Cup silhouette */}
          <div className="hidden xl:flex flex-col items-end gap-5 absolute right-4 top-20 z-20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3EDE2] to-[#C8BEB0] p-1.5 shadow-xl border border-black/15 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4B2E1E] to-[#2B180E]" />
            </div>
            <div className="w-6 h-48 rounded-sm bg-gradient-to-r from-[#D5B56E] to-[#B79348] shadow-lg border border-black/15 opacity-80 flex flex-col justify-between py-3 px-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((tick) => (
                <span key={tick} className="block w-2.5 h-px bg-black/40" />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Notebook Centerpiece */}
      <div className="relative z-10">{children}</div>

      {/* Interactive Desk Wastebasket (Receives thrown crumpled papers & opens recovery drawer) */}
      <button
        ref={basketRef}
        type="button"
        onClick={onOpenArchiveDrawer}
        aria-label={`Wastebasket and archived pages (${basketCount})`}
        title="Click to inspect or recover thrown pages from wastebasket"
        className={`relative mt-4 ml-auto md:mt-0 md:absolute md:bottom-5 md:right-5 z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center transition-transform cursor-pointer shadow-xl border border-white/15 ${
          basketShake ? 'scale-110 rotate-6' : 'hover:scale-105'
        }`}
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #4A4D54 0%, #24262B 70%, #16171B 100%)',
          color: '#EAE6DD',
        }}
      >
        <Trash2 className="w-5 h-5" />
        <span className="text-[10px] font-mono-tabular mt-0.5">{basketCount}</span>
      </button>

      {/* Floating Torn / Folded / Crumpled Paper Objects */}
      {activeDeskPapers.map((obj) => (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          onPointerMove={handleObjectPointerMove}
          onPointerUp={(e) => handleObjectPointerUp(e, obj)}
          style={{
            position: 'absolute',
            left: `clamp(64px, ${obj.x}px, calc(100% - 68px))`,
            top: `${obj.y}px`,
            transform: `translate(-50%, -50%) rotate(${obj.rotation}deg)`,
            touchAction: 'none',
          }}
          className="z-30 cursor-grab active:cursor-grabbing select-none group"
        >
          <CrumpledPaperVisual obj={obj} />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRestoreTornPage(obj.sourcePageId);
            }}
            aria-label={`Restore ${obj.title} to notebook`}
            title="Restore page to notebook"
            className="mt-1.5 mx-auto flex items-center gap-1 rounded-full bg-black/75 text-white px-2.5 py-1 text-[10px] font-medium opacity-90 hover:opacity-100 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore</span>
          </button>
        </div>
      ))}
    </div>
  );
};
