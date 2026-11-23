import React, { useRef, useState } from 'react';
import type { InkStroke, StrokePoint, WritingInstrument } from '../../types/journal';
import { buildSmoothStrokePath, eraseStrokesNearPoint } from '../../utils/journalEngine';
import { paperAudio } from '../../utils/paperAudio';

interface InkCanvasLayerProps {
  activeTool: 'type' | 'draw' | 'erase';
  instrument: WritingInstrument;
  inkColor: string;
  strokes: InkStroke[];
  onChangeStrokes: (nextStrokes: InkStroke[]) => void;
}

function getInstrumentStrokeMetrics(instrument: WritingInstrument): {
  baseWidth: number;
  opacity: number;
} {
  switch (instrument) {
    case 'fine-tip':
      return { baseWidth: 1.8, opacity: 0.94 };
    case 'fountain':
      return { baseWidth: 3.1, opacity: 0.96 };
    case 'ballpoint':
      return { baseWidth: 2.2, opacity: 0.88 };
    case 'pencil':
      return { baseWidth: 2.3, opacity: 0.54 };
    case 'highlighter':
      return { baseWidth: 15.5, opacity: 0.34 };
    case 'colored':
      return { baseWidth: 2.8, opacity: 0.92 };
  }
}

export const InkCanvasLayer: React.FC<InkCanvasLayerProps> = ({
  activeTool,
  instrument,
  inkColor,
  strokes,
  onChangeStrokes,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activePoints, setActivePoints] = useState<StrokePoint[] | null>(null);
  const activePointerId = useRef<number | null>(null);

  const isInteractive = activeTool === 'draw' || activeTool === 'erase';

  const toNormalizedPoint = (e: React.PointerEvent<SVGSVGElement>): StrokePoint => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 0.5, y: 0.5, pressure: 0.5 };
    }
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const pressure = e.pressure && e.pressure > 0 ? Math.min(1, e.pressure) : 0.55;
    return { x, y, pressure };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    const pt = toNormalizedPoint(e);

    if (activeTool === 'erase') {
      const next = eraseStrokesNearPoint(strokes, pt, 0.032);
      if (next.length !== strokes.length) {
        onChangeStrokes(next);
        paperAudio.playWriteScratch();
      }
      setActivePoints([pt]);
      return;
    }

    setActivePoints([pt]);
    paperAudio.playWriteScratch();
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || activePointerId.current !== e.pointerId || !activePoints) return;
    const pt = toNormalizedPoint(e);

    if (activeTool === 'erase') {
      const next = eraseStrokesNearPoint(strokes, pt, 0.032);
      if (next.length !== strokes.length) {
        onChangeStrokes(next);
        paperAudio.playWriteScratch();
      }
      return;
    }

    const last = activePoints[activePoints.length - 1];
    const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
    if (dist < 0.0025) return;

    setActivePoints((prev) => (prev ? [...prev, pt] : [pt]));
    paperAudio.playWriteScratch();
  };

  const finishStroke = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;
    if (activeTool === 'draw' && activePoints && activePoints.length >= 1) {
      const metrics = getInstrumentStrokeMetrics(instrument);
      const avgPressure =
        activePoints.reduce((acc, p) => acc + p.pressure, 0) / activePoints.length;
      const pressureScale = instrument === 'fountain' ? 0.72 + avgPressure * 0.75 : 1;
      const newStroke: InkStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        instrument,
        color: instrument === 'highlighter' ? '#F5D048' : instrument === 'pencil' ? '#4B4E53' : inkColor,
        baseWidth: Number((metrics.baseWidth * pressureScale).toFixed(2)),
        opacity: metrics.opacity,
        points: activePoints,
      };
      onChangeStrokes([...strokes, newStroke]);
    }
    setActivePoints(null);
  };

  const metrics = getInstrumentStrokeMetrics(instrument);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1000 1400"
      preserveAspectRatio="none"
      data-testid="paper-ink-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      className={`absolute inset-0 w-full h-full z-20 ${
        isInteractive
          ? activeTool === 'erase'
            ? 'pointer-events-auto cursor-cell touch-none'
            : 'pointer-events-auto cursor-crosshair touch-none'
          : 'pointer-events-none'
      }`}
    >
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={buildSmoothStrokePath(stroke.points, 1000, 1400)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.baseWidth * 1.4}
          strokeOpacity={stroke.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            stroke.instrument === 'highlighter'
              ? { mixBlendMode: 'multiply' }
              : stroke.instrument === 'pencil'
              ? { strokeDasharray: '1 0.35' }
              : undefined
          }
        />
      ))}

      {activeTool === 'draw' && activePoints && activePoints.length > 0 && (
        <path
          d={buildSmoothStrokePath(activePoints, 1000, 1400)}
          fill="none"
          stroke={
            instrument === 'highlighter'
              ? '#F5D048'
              : instrument === 'pencil'
              ? '#4B4E53'
              : inkColor
          }
          strokeWidth={metrics.baseWidth * 1.4}
          strokeOpacity={metrics.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
