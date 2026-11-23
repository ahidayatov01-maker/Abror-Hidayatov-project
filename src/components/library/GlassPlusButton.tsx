import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsPresent } from 'motion/react';
import { Plus } from 'lucide-react';
import { computeExpSmoothingFactor } from '../../motion/lightingMath';

interface GlassPlusButtonProps {
  onClick: () => void;
  label: string;
}

export const GlassPlusButton: React.FC<GlassPlusButtonProps> = ({ onClick, label }) => {
  const isPresent = useIsPresent();
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const stateRef = useRef({
    rx: 0,
    ry: 0,
    gx: 50,
    gy: 35,
    trx: 0,
    try: 0,
    tgx: 50,
    tgy: 35,
  });

  const scheduleStep = () => {
    if (rafRef.current !== null) return;
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      rafRef.current = null;
      const el = btnRef.current;
      if (!el || !el.isConnected) return;

      const dtMs = now - lastFrameRef.current;
      lastFrameRef.current = now;
      const alpha = computeExpSmoothingFactor(dtMs, 11);
      const s = stateRef.current;

      s.rx += (s.trx - s.rx) * alpha;
      s.ry += (s.try - s.ry) * alpha;
      s.gx += (s.tgx - s.gx) * alpha;
      s.gy += (s.tgy - s.gy) * alpha;

      const settled =
        Math.abs(s.trx - s.rx) < 0.04 &&
        Math.abs(s.try - s.ry) < 0.04 &&
        Math.abs(s.tgx - s.gx) < 0.15 &&
        Math.abs(s.tgy - s.gy) < 0.15;

      if (settled) {
        s.rx = s.trx;
        s.ry = s.try;
        s.gx = s.tgx;
        s.gy = s.tgy;
      }

      el.style.setProperty('--fab-rx', `${s.rx.toFixed(2)}deg`);
      el.style.setProperty('--fab-ry', `${s.ry.toFixed(2)}deg`);
      el.style.setProperty('--fab-gx', `${s.gx.toFixed(1)}%`);
      el.style.setProperty('--fab-gy', `${s.gy.toFixed(1)}%`);

      if (!settled) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    rectRef.current = e.currentTarget.getBoundingClientRect();
    setHovered(true);
  };

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = rectRef.current || e.currentTarget.getBoundingClientRect();
    rectRef.current = rect;
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    stateRef.current.trx = (0.5 - y) * 16;
    stateRef.current.try = (x - 0.5) * 16;
    stateRef.current.tgx = Math.max(5, Math.min(95, x * 100));
    stateRef.current.tgy = Math.max(5, Math.min(95, y * 100));
    scheduleStep();
  };

  const handleLeave = () => {
    setHovered(false);
    rectRef.current = null;
    stateRef.current.trx = 0;
    stateRef.current.try = 0;
    stateRef.current.tgx = 50;
    stateRef.current.tgy = 35;
    scheduleStep();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed bottom-20 lg:bottom-8 right-5 sm:right-8 z-30 transition-[opacity,transform] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        perspective: '700px',
        opacity: isPresent ? 1 : 0,
        transform: isPresent ? 'scale(1)' : 'scale(0.92)',
        pointerEvents: isPresent ? 'auto' : 'none',
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onPointerMove={handleMove}
        aria-label={label}
        title={label}
        data-testid="glass-plus-button"
        style={{
          transform: hovered
            ? 'rotateX(var(--fab-rx, 0deg)) rotateY(var(--fab-ry, 0deg)) translateY(-4px) scale(1.06)'
            : 'rotateX(var(--fab-rx, 0deg)) rotateY(var(--fab-ry, 0deg)) translateY(0px) scale(1)',
          background:
            'radial-gradient(circle at var(--fab-gx, 50%) var(--fab-gy, 35%), rgba(52, 211, 153, 0.42), rgba(6, 78, 59, 0.84) 55%, rgba(3, 24, 17, 0.94) 100%)',
          boxShadow:
            '0 14px 32px -8px rgba(3, 24, 17, 0.65), 0 0 22px rgba(16, 185, 129, 0.34), inset 0 1px 1px rgba(255, 255, 255, 0.36), inset 0 -2px 6px rgba(2, 20, 14, 0.70)',
        }}
        className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-emerald-300/65 flex items-center justify-center text-emerald-100 transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2px] rounded-[14px] border border-emerald-200/20"
        />
        <Plus
          className={`w-7 h-7 sm:w-8 sm:h-8 text-emerald-100 drop-shadow-[0_0_10px_rgba(110,231,183,0.85)] transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            hovered ? 'rotate-90 scale-110' : ''
          }`}
        />
      </button>
    </div>,
    document.body
  );
};
