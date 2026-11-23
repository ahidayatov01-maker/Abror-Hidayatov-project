import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Pencil,
  Presentation,
  Sparkles,
  Star,
  StickyNote,
  Trash2,
} from 'lucide-react';
import type {
  FolderAccentVariant,
  LibraryFolderRecord,
  LibraryMaterialRecord,
} from '../../types/domain';
import type { ComputedFolderMetrics } from '../../utils/researchLibraryEngine';
import { getMaterialBlob } from '../../utils/libraryBlobStore';
import { computeExpSmoothingFactor } from '../../motion/lightingMath';
import type { LibraryLocaleStrings } from './libraryStrings';

interface GlassFolder3DProps {
  folder: LibraryFolderRecord;
  materials: LibraryMaterialRecord[];
  metrics: ComputedFolderMetrics;
  strings: LibraryLocaleStrings;
  onOpen: (folderId: string) => void;
  onToggleFavorite: (folderId: string) => void;
  onRename: (folder: LibraryFolderRecord) => void;
  onDelete: (folder: LibraryFolderRecord) => void;
}

const ACCENT_STYLES: Record<
  FolderAccentVariant,
  {
    glow: string;
    rim: string;
    backBg: string;
    frontBg: string;
    tabBg: string;
    barColor: string;
  }
> = {
  emerald: {
    glow: 'rgba(16, 185, 129, 0.34)',
    rim: 'rgba(110, 231, 183, 0.42)',
    backBg: 'linear-gradient(155deg, rgba(6, 78, 59, 0.72), rgba(2, 24, 18, 0.88))',
    frontBg:
      'linear-gradient(165deg, rgba(52, 211, 153, 0.20), rgba(6, 78, 59, 0.46) 55%, rgba(3, 20, 14, 0.76))',
    tabBg: 'linear-gradient(180deg, rgba(16, 185, 129, 0.42), rgba(6, 78, 59, 0.72))',
    barColor: 'from-emerald-400 to-teal-300',
  },
  jade: {
    glow: 'rgba(20, 184, 166, 0.30)',
    rim: 'rgba(94, 234, 212, 0.40)',
    backBg: 'linear-gradient(155deg, rgba(17, 94, 89, 0.70), rgba(3, 26, 24, 0.88))',
    frontBg:
      'linear-gradient(165deg, rgba(45, 212, 191, 0.19), rgba(15, 76, 68, 0.46) 55%, rgba(4, 22, 20, 0.76))',
    tabBg: 'linear-gradient(180deg, rgba(20, 184, 166, 0.40), rgba(17, 94, 89, 0.72))',
    barColor: 'from-teal-300 to-emerald-400',
  },
  mint: {
    glow: 'rgba(52, 211, 153, 0.36)',
    rim: 'rgba(167, 243, 208, 0.48)',
    backBg: 'linear-gradient(155deg, rgba(5, 92, 66, 0.70), rgba(3, 28, 20, 0.88))',
    frontBg:
      'linear-gradient(165deg, rgba(110, 231, 183, 0.22), rgba(6, 95, 70, 0.44) 55%, rgba(3, 22, 16, 0.74))',
    tabBg: 'linear-gradient(180deg, rgba(52, 211, 153, 0.44), rgba(6, 95, 70, 0.70))',
    barColor: 'from-emerald-300 to-emerald-500',
  },
  teal: {
    glow: 'rgba(13, 148, 136, 0.32)',
    rim: 'rgba(153, 246, 228, 0.38)',
    backBg: 'linear-gradient(155deg, rgba(19, 78, 74, 0.72), rgba(4, 22, 24, 0.90))',
    frontBg:
      'linear-gradient(165deg, rgba(94, 234, 212, 0.18), rgba(17, 94, 89, 0.45) 55%, rgba(3, 19, 20, 0.78))',
    tabBg: 'linear-gradient(180deg, rgba(20, 184, 166, 0.38), rgba(19, 78, 74, 0.72))',
    barColor: 'from-teal-400 to-emerald-300',
  },
  forest: {
    glow: 'rgba(22, 163, 74, 0.30)',
    rim: 'rgba(134, 239, 172, 0.38)',
    backBg: 'linear-gradient(155deg, rgba(20, 83, 45, 0.74), rgba(3, 22, 11, 0.90))',
    frontBg:
      'linear-gradient(165deg, rgba(74, 222, 128, 0.18), rgba(20, 83, 45, 0.46) 55%, rgba(3, 18, 9, 0.78))',
    tabBg: 'linear-gradient(180deg, rgba(34, 197, 94, 0.38), rgba(20, 83, 45, 0.72))',
    barColor: 'from-green-400 to-emerald-300',
  },
  sage: {
    glow: 'rgba(110, 231, 183, 0.26)',
    rim: 'rgba(209, 250, 229, 0.36)',
    backBg: 'linear-gradient(155deg, rgba(22, 78, 63, 0.68), rgba(5, 22, 18, 0.88))',
    frontBg:
      'linear-gradient(165deg, rgba(167, 243, 208, 0.17), rgba(16, 78, 62, 0.44) 55%, rgba(4, 20, 16, 0.76))',
    tabBg: 'linear-gradient(180deg, rgba(110, 231, 183, 0.32), rgba(22, 78, 63, 0.68))',
    barColor: 'from-emerald-200 to-emerald-400',
  },
};

const MiniMaterialSheet: React.FC<{
  material: LibraryMaterialRecord;
  slotIndex: number;
  hovered: boolean;
}> = ({ material, slotIndex, hovered }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (material.materialType === 'image' && material.hasLocalBlob) {
      getMaterialBlob(material.id).then((rec) => {
        if (active && rec?.previewDataUrl) {
          setThumbUrl(rec.previewDataUrl);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [material.id, material.materialType, material.hasLocalBlob]);

  const restTransforms = [
    'translateX(-18px) translateY(-10px) rotateZ(-6deg) translateZ(10px)',
    'translateX(0px) translateY(-16px) rotateZ(0deg) translateZ(16px)',
    'translateX(18px) translateY(-8px) rotateZ(6deg) translateZ(12px)',
  ];
  const hoverTransforms = [
    'translateX(-30px) translateY(-24px) rotateZ(-10deg) translateZ(20px)',
    'translateX(0px) translateY(-30px) rotateZ(0deg) translateZ(28px)',
    'translateX(30px) translateY(-22px) rotateZ(10deg) translateZ(22px)',
  ];

  const transform = hovered
    ? hoverTransforms[slotIndex % 3]
    : restTransforms[slotIndex % 3];

  const snippet = (material.extractedText || material.notes || '').slice(0, 72);

  return (
    <div
      style={{
        transform,
        transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-3 w-[114px] h-[124px] rounded-xl border border-emerald-200/35 bg-[#0c2b20]/95 shadow-[0_8px_20px_rgba(0,0,0,0.45)] overflow-hidden p-2.5 flex flex-col justify-between"
    >
      {material.materialType === 'image' && thumbUrl ? (
        <div className="w-full h-full flex flex-col gap-1.5">
          <div className="flex-1 rounded-lg overflow-hidden bg-black/40 border border-emerald-300/20">
            <img
              src={thumbUrl}
              alt={material.title}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[9px] font-medium text-emerald-100/90 truncate">{material.title}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1 border-b border-emerald-400/20 pb-1.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
              {material.materialType === 'pdf' && <FileText className="w-2.5 h-2.5" />}
              {material.materialType === 'presentation' && <Presentation className="w-2.5 h-2.5" />}
              {material.materialType === 'image' && <ImageIcon className="w-2.5 h-2.5" />}
              {material.materialType === 'link' && <Globe className="w-2.5 h-2.5" />}
              {(material.materialType === 'word' ||
                material.materialType === 'note' ||
                material.materialType === 'study_doc' ||
                material.materialType === 'other') && <StickyNote className="w-2.5 h-2.5" />}
              <span>
                {material.materialType === 'presentation' ? 'PPTX' : material.materialType.toUpperCase()}
              </span>
            </span>
            {material.pageCount ? (
              <span className="text-[8px] font-mono text-emerald-200/70">{material.pageCount}p</span>
            ) : null}
          </div>

          <div className="space-y-1 flex-1 pt-1.5 overflow-hidden">
            <p className="text-[10px] font-semibold text-white leading-tight line-clamp-2">
              {material.title}
            </p>
            {snippet ? (
              <p className="text-[8px] text-emerald-100/60 leading-snug line-clamp-3">
                {snippet}
              </p>
            ) : (
              <div className="space-y-1 pt-1">
                <div className="h-1 w-4/5 rounded-full bg-emerald-300/20" />
                <div className="h-1 w-3/5 rounded-full bg-emerald-300/15" />
                <div className="h-1 w-2/3 rounded-full bg-emerald-300/15" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const GlassFolder3D: React.FC<GlassFolder3DProps> = ({
  folder,
  materials,
  metrics,
  strings,
  onOpen,
  onToggleFavorite,
  onRename,
  onDelete,
}) => {
  const accent = ACCENT_STYLES[folder.accentVariant] || ACCENT_STYLES.emerald;
  const previewMaterials = materials.slice(0, 3);

  const [hovered, setHovered] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cachedRectRef = useRef<DOMRect | null>(null);
  const tiltRef = useRef({
    rx: 0,
    ry: 0,
    gx: 45,
    gy: 28,
    tx: 0,
    ty: 0,
    tgx: 45,
    tgy: 28,
  });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; moved: boolean }>({
    active: false,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const aiLabel =
    metrics.aiStatus === 'complete'
      ? strings.aiComplete
      : metrics.aiStatus === 'partial'
      ? strings.aiPartial
      : strings.aiNone;

  const scheduleTiltLoop = () => {
    if (rafRef.current !== null) return;
    lastFrameRef.current = performance.now();

    const step = (now: number) => {
      rafRef.current = null;
      const el = stageRef.current;
      if (!el || !el.isConnected) return;

      const dtMs = now - lastFrameRef.current;
      lastFrameRef.current = now;
      const alpha = computeExpSmoothingFactor(dtMs, dragRef.current.active ? 20 : 10.5);
      const t = tiltRef.current;

      t.rx += (t.tx - t.rx) * alpha;
      t.ry += (t.ty - t.ry) * alpha;
      t.gx += (t.tgx - t.gx) * alpha;
      t.gy += (t.tgy - t.gy) * alpha;

      const settled =
        Math.abs(t.tx - t.rx) < 0.04 &&
        Math.abs(t.ty - t.ry) < 0.04 &&
        Math.abs(t.tgx - t.gx) < 0.15 &&
        Math.abs(t.tgy - t.gy) < 0.15;

      if (settled) {
        t.rx = t.tx;
        t.ry = t.ty;
        t.gx = t.tgx;
        t.gy = t.tgy;
      }

      el.style.setProperty('--folder-rx', `${t.rx.toFixed(2)}deg`);
      el.style.setProperty('--folder-ry', `${t.ry.toFixed(2)}deg`);
      el.style.setProperty('--folder-gx', `${t.gx.toFixed(1)}%`);
      el.style.setProperty('--folder-gy', `${t.gy.toFixed(1)}%`);

      if (!settled) {
        rafRef.current = window.requestAnimationFrame(step);
      }
    };

    rafRef.current = window.requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    cachedRectRef.current = e.currentTarget.getBoundingClientRect();
    setHovered(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = cachedRectRef.current || e.currentTarget.getBoundingClientRect();
    cachedRectRef.current = rect;
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 6) {
        dragRef.current.moved = true;
      }
      tiltRef.current.tx = Math.max(-16, Math.min(16, -dy * 0.14));
      tiltRef.current.ty = Math.max(-16, Math.min(16, dx * 0.14));
      tiltRef.current.tgx = Math.max(5, Math.min(95, x * 100));
      tiltRef.current.tgy = Math.max(5, Math.min(95, y * 100));
    } else {
      tiltRef.current.tx = (0.5 - y) * 13;
      tiltRef.current.ty = (x - 0.5) * 15;
      tiltRef.current.tgx = Math.max(5, Math.min(95, x * 100));
      tiltRef.current.tgy = Math.max(5, Math.min(95, y * 100));
    }

    scheduleTiltLoop();
  };

  const handlePointerLeave = () => {
    setHovered(false);
    cachedRectRef.current = null;
    dragRef.current.active = false;
    tiltRef.current.tx = 0;
    tiltRef.current.ty = 0;
    tiltRef.current.tgx = 45;
    tiltRef.current.tgy = 28;
    scheduleTiltLoop();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePointerUp = () => {
    const wasDragged = dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    if (!wasDragged) {
      onOpen(folder.id);
    }
  };

  return (
    <div
      data-testid={`glass-folder-card-${folder.id}`}
      className="group flex flex-col rounded-2xl border border-emerald-400/20 bg-[#05140e]/75 p-4 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-emerald-300/45 hover:bg-[#071c13]/85"
    >
      {/* 3D Interactive Glass Folder Viewport (zero React state updates per pointermove) */}
      <div
        ref={stageRef}
        role="button"
        tabIndex={0}
        aria-label={`Open folder ${folder.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(folder.id);
          }
        }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ perspective: '1100px' }}
        className="relative h-48 w-full select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/60 rounded-xl"
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: hovered
              ? 'rotateX(var(--folder-rx, 0deg)) rotateY(var(--folder-ry, 0deg)) translateY(-6px)'
              : 'rotateX(var(--folder-rx, 0deg)) rotateY(var(--folder-ry, 0deg)) translateY(0px)',
            transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative w-full h-full pt-4"
        >
          {/* Ambient Backlight Glow */}
          <div
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at var(--folder-gx, 45%) var(--folder-gy, 28%), ${accent.glow}, transparent 72%)`,
              opacity: hovered ? 0.95 : 0.55,
              transition: 'opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="pointer-events-none absolute -inset-2 rounded-2xl blur-xl"
          />

          {/* Top-Left Index Tab */}
          <div
            style={{
              background: accent.tabBg,
              borderColor: accent.rim,
              transform: 'translateZ(-6px)',
            }}
            className="relative z-0 ml-2 w-24 h-5 rounded-t-xl border border-b-0 flex items-center px-2.5"
          >
            <span className="w-8 h-1 rounded-full bg-emerald-200/45" />
          </div>

          {/* Back Translucent Glass Plate */}
          <div
            style={{
              background: accent.backBg,
              borderColor: accent.rim,
              transform: 'translateZ(-4px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 16px 30px -12px rgba(0,0,0,0.65)',
            }}
            className="relative w-full h-[148px] rounded-2xl rounded-tl-none border overflow-visible"
          >
            {/* Internal Fanned File Miniatures */}
            <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              {previewMaterials.length > 0 ? (
                previewMaterials.map((mat, idx) => (
                  <MiniMaterialSheet
                    key={mat.id}
                    material={mat}
                    slotIndex={idx}
                    hovered={hovered}
                  />
                ))
              ) : (
                <div
                  style={{ transform: 'translateZ(8px)' }}
                  className="pointer-events-none absolute inset-x-5 top-4 bottom-8 rounded-xl border border-dashed border-emerald-300/20 bg-emerald-950/35 flex items-center justify-center"
                >
                  <span className="text-[11px] font-medium text-emerald-200/55">
                    0 {strings.itemsLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Translucent Front Glass Flap */}
            <div
              style={{
                background: accent.frontBg,
                borderColor: accent.rim,
                transformOrigin: 'bottom center',
                transform: hovered
                  ? 'translateZ(30px) rotateX(-20deg)'
                  : 'translateZ(24px) rotateX(-4deg)',
                transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow:
                  'inset 0 1.5px 1px rgba(255,255,255,0.34), inset 0 -8px 20px rgba(2,20,14,0.45)',
              }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[102px] rounded-2xl border overflow-hidden flex flex-col justify-between p-3.5"
            >
              {/* Moving Diagonal Specular Light */}
              <div
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(circle at var(--folder-gx, 45%) var(--folder-gy, 28%), rgba(236, 253, 245, 0.28), transparent 62%)',
                }}
                className="absolute inset-0"
              />
              {/* Top Specular Lip */}
              <div className="relative h-px w-full bg-gradient-to-r from-transparent via-emerald-200/75 to-transparent" />

              {/* Clean Folder Glass Etching */}
              <div className="relative flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-200/80">
                    {metrics.materialCount}{' '}
                    {metrics.materialCount === 1 && strings.itemsLabel === 'items'
                      ? 'item'
                      : strings.itemsLabel}
                  </p>
                  <div className="mt-1.5 h-1.5 w-24 rounded-full bg-black/35 overflow-hidden border border-white/10">
                    <div
                      className={`h-full bg-gradient-to-r ${accent.barColor} transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
                      style={{ width: `${metrics.progressPct}%` }}
                    />
                  </div>
                </div>

                {metrics.aiStatus !== 'none' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-200 bg-emerald-950/55 border border-emerald-300/30 rounded-md px-1.5 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                    <span>{metrics.analyzedCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Info & Controls Footer */}
      <div className="pt-3 border-t border-emerald-400/15 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpen(folder.id)}
            className="text-left min-w-0 flex-1 cursor-pointer group/title"
          >
            <h3 className="text-base font-semibold text-white group-hover/title:text-emerald-200 transition-colors duration-300 truncate">
              {folder.name}
            </h3>
            {folder.description && (
              <p className="text-xs text-emerald-100/60 line-clamp-1 mt-0.5">
                {folder.description}
              </p>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(folder.id)}
              aria-label={`Favorite ${folder.name}`}
              className={`p-1.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                folder.isFavorite
                  ? 'text-emerald-300 bg-emerald-500/15'
                  : 'text-emerald-100/45 hover:text-emerald-200 hover:bg-emerald-500/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${folder.isFavorite ? 'fill-emerald-300' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onRename(folder)}
              aria-label={`${strings.renameFolder}: ${folder.name}`}
              className="p-1.5 rounded-lg text-emerald-100/45 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors duration-300 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(folder)}
              aria-label={`${strings.deleteFolder}: ${folder.name}`}
              className="p-1.5 rounded-lg text-emerald-100/45 hover:text-rose-300 hover:bg-rose-500/15 transition-colors duration-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-emerald-200/70 flex items-center justify-between gap-2">
          <span>
            {metrics.materialCount}{' '}
            {metrics.materialCount === 1 && strings.itemsLabel === 'items'
              ? 'item'
              : strings.itemsLabel}{' '}
            · {metrics.progressPct}% {strings.progressLabel}
          </span>
          <span className="text-emerald-300/80">{aiLabel}</span>
        </p>
      </div>
    </div>
  );
};
