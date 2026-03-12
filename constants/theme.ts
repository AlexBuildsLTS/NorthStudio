/**
 * @file constants/theme.ts
 * @description Master design system tokens for North Studio.
 * High-fidelity Cyberpunk palette with Deep Obsidian and Neon accents.
 */

export const NORTH_THEME = {
  colors: {
    background: {
      primary: '#02010A', // Deepest Obsidian
      secondary: '#0D0221', // Deep Violet Noir
      elevated: 'rgba(25, 10, 45, 0.4)', // Transparent Glass
    },
    accent: {
      cyan: '#00F0FF',
      purple: '#B026FF',
      pink: '#FF3366',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      muted: '#64748B',
      cyan: '#80F8FF',
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.08)',
      glassActive: 'rgba(0, 240, 255, 0.4)', // REQUIRED BY GLASSCARD
      cyan: 'rgba(0, 240, 255, 0.3)',
      glowCyan: 'rgba(0, 240, 255, 0.3)', // REQUIRED BY ASSETS
      glowPurple: 'rgba(176, 38, 255, 0.3)',
    },
  },
  animation: {
    spring: { damping: 16, stiffness: 120, mass: 0.8 },
    springBouncy: { damping: 12, stiffness: 200, mass: 1 }, // REQUIRED BY GLASSCARD
    fade: { duration: 250 },
  },
  layout: {
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      pill: 9999,
    },
  },
} as const;
