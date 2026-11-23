import React from 'react';

export type GlassButtonVariant = 'primary' | 'glass' | 'pill' | 'subtle';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  active?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  active = false,
  className = '',
  type = 'button',
  children,
  ...rest
}) => {
  let variantClass = 'btn-glass';
  if (variant === 'primary') {
    variantClass = 'btn-primary';
  } else if (variant === 'pill') {
    variantClass = active
      ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
      : 'btn-glass text-[var(--text-secondary)]';
  } else if (variant === 'subtle') {
    variantClass = 'surface-subtle text-[var(--text-muted)]';
  }

  return (
    <button
      type={type}
      className={`${variantClass} transition-[transform,opacity,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
};
