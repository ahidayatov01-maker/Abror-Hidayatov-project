import React, { useEffect, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import {
  getCuratedFallbackCampusImage,
  getUniversityCampusImageUrl,
} from '../data/seedCatalog';

interface InstitutionalMediaPlateProps {
  title: string;
  subtitle: string;
  monogram: string;
  motif: string;
  accentHue?: string;
  imageUrl?: string | null;
  universitySlug?: string | null;
  officialMediaUrl?: string;
  officialLabel?: string;
  aspectClass?: string;
  coordinatesLabel?: string;
  compact?: boolean;
}

export const InstitutionalMediaPlate: React.FC<InstitutionalMediaPlateProps> = ({
  title,
  subtitle,
  monogram,
  accentHue = '#1E3A8A',
  imageUrl,
  universitySlug,
  officialMediaUrl,
  officialLabel = 'Official Campus Gallery',
  aspectClass = 'h-48',
  coordinatesLabel,
  compact = false,
}) => {
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  useEffect(() => {
    setUseFallbackImage(false);
  }, [imageUrl, universitySlug, title]);

  const primaryImageUrl = getUniversityCampusImageUrl(universitySlug, imageUrl);
  const fallbackImageUrl = getCuratedFallbackCampusImage(universitySlug || title);
  const activeImageSrc = useFallbackImage ? fallbackImageUrl : primaryImageUrl;

  return (
    <div
      data-testid="institutional-media-plate"
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-slate-950 shadow-lg ${aspectClass} flex flex-col justify-between p-5 sm:p-6 select-none`}
    >
      {/* Real high-resolution university campus photograph with onError fallback */}
      <img
        src={activeImageSrc}
        alt={`${title} campus architecture`}
        referrerPolicy="no-referrer"
        onError={() => {
          if (!useFallbackImage) {
            setUseFallbackImage(true);
          }
        }}
        data-testid="university-hero-campus-image"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />

      {/* Top and bottom dark gradient overlays so all badges, titles, and buttons remain sharp and readable */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
      />

      {/* Top row: Institutional Initials Badge (Monogram) & Coordinates Badge */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          className="inline-flex h-11 min-w-11 px-3 items-center justify-center rounded-xl border border-white/25 bg-black/55 backdrop-blur-md shadow-md font-display text-lg font-bold tracking-tight text-white"
          style={{
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 14px rgba(0,0,0,0.35)`,
            borderBottomColor: accentHue,
          }}
          data-testid="university-hero-initials-badge"
        >
          {monogram}
        </div>
        {coordinatesLabel && (
          <span
            data-testid="university-hero-coordinates-badge"
            className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-white/95 bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span>{coordinatesLabel}</span>
          </span>
        )}
      </div>

      {/* Bottom row: Subtitle, University Title & Official Campus Gallery Button */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-6">
        <div className="min-w-0 space-y-0.5">
          {!compact && subtitle && (
            <p className="text-xs font-medium tracking-wide text-white/80 truncate drop-shadow-sm">
              {subtitle}
            </p>
          )}
          <h4
            data-testid="university-hero-plate-title"
            className="font-display text-2xl sm:text-3xl font-semibold text-white leading-tight drop-shadow-md"
          >
            {title}
          </h4>
        </div>
        {officialMediaUrl && (
          <a
            href={officialMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            data-testid="university-hero-gallery-btn"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shadow-md"
          >
            <span>{officialLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
