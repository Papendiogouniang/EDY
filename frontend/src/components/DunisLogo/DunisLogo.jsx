import React from 'react';
import logoColor from '../../assets/dunis-logo.png';
import './DunisLogo.css';

/**
 * DunisLogo — DUNIS Africa official logo
 * size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * variant: 'color' | 'white' | 'pill'
 *   - color: original black+gold on transparent (use on light backgrounds)
 *   - white: logo inside a white pill (use on dark backgrounds)
 *   - pill:  same as white
 */
export default function DunisLogo({ size = 'md', variant = 'color', className = '' }) {
  const heights = { xs: 28, sm: 36, md: 48, lg: 64, xl: 96 };
  const h = heights[size] || 48;

  // On dark backgrounds, wrap in white pill so logo colors show correctly
  if (variant === 'white' || variant === 'pill') {
    return (
      <div
        className={`dunis-logo-pill ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: 8,
          padding: '5px 12px',
          height: h + 10,
        }}
      >
        <img
          src={logoColor}
          alt="DUNIS Africa"
          style={{ height: h - 4, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>
    );
  }

  // Default: show logo as-is (for light backgrounds)
  return (
    <img
      src={logoColor}
      alt="DUNIS Africa — Dakar University of International Studies"
      className={`dunis-logo ${className}`}
      style={{
        height: h, width: 'auto',
        display: 'block', flexShrink: 0,
        objectFit: 'contain',
      }}
    />
  );
}
