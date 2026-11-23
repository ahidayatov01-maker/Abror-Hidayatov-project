import React from 'react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const GlassInput: React.FC<GlassInputProps> = ({ className = '', ...rest }) => (
  <input
    className={`glass-input rounded-xl px-3 py-2 text-sm ${className}`.trim()}
    {...rest}
  />
);

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  className = '',
  children,
  ...rest
}) => (
  <select
    className={`glass-input rounded-xl px-3 py-2 text-xs font-medium ${className}`.trim()}
    {...rest}
  >
    {children}
  </select>
);

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({ className = '', ...rest }) => (
  <textarea
    className={`glass-input rounded-xl px-3 py-2 text-sm ${className}`.trim()}
    {...rest}
  />
);
