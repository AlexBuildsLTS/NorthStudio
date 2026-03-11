// constants/theme.ts
export const NORTH_THEME = {
  colors: {
    background: {
      primary: '#0A0D14',   // Deep Dark Mode primary
      secondary: '#0D1117', // Secondary panels
      card: 'rgba(13, 13, 25, 0.65)', // Glassmorphism base
    },
    accent: {
      purple: '#B026FF', // Electric Purple
      pink: '#FF3399',   // Hot Pink
      cyan: '#00F0FF',   // Cyber Cyan
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8', // Slate-400 equivalent
      muted: '#64748B',     // Slate-500 equivalent
    },
    border: {
      glass: 'rgba(0, 0, 255, 0.08)',
      active: 'rgba(0, 0, 255, 0.05)', // Purple glow
    }
  },
  animation: {
    spring: { damping: 15, stiffness: 150, mass: 1 },
  }
} as const;