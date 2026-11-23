import React from 'react';

export type GlassVariant = 'card' | 'panel' | 'subtle' | 'hud';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'nav';
}

const VARIANT_CLASSES: Record<GlassVariant, string> = {
  card: 'surface-card',
  panel: 'glass-panel',
  subtle: 'surface-subtle',
  hud: 'glass-hud-solid',
};

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  variant = 'card',
  interactive = false,
  as = 'div',
  className = '',
  children,
  ...rest
}) => {
  const Component = as;
  const variantClass = VARIANT_CLASSES[variant];
  const interactiveClass = interactive ? 'glass-interactive' : '';

  return (
    <Component
      data-glass-surface="true"
      className={`${variantClass} ${interactiveClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
};

export const GlassPanel: React.FC<Omit<GlassSurfaceProps, 'variant'>> = ({
  className = '',
  children,
  ...rest
}) => (
  <GlassSurface variant="panel" className={className} {...rest}>
    {children}
  </GlassSurface>
);

export const GlassInteractive: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <GlassSurface variant="card" interactive className={className} {...rest}>
    {children}
  </GlassSurface>
);
