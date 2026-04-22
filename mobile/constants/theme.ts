// ─── Color Palettes ──────────────────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgElevated: string;
  border: string;
  borderLight: string;

  primary: string;
  primaryDark: string;
  primaryGlow: string;

  accent: string;
  accentLight: string;
  accentGlow: string;

  danger: string;
  dangerGlow: string;
  dangerDark: string;

  success: string;
  successDark: string;
  successGlow: string;
  warning: string;
  warningDark: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  sosRed: string;
  sosRedGlow: string;
  sosRedDark: string;
  sosRedPulse: string;

  gradient: {
    sos: string[];
    primary: string[];
    card: string[];
    success: string[];
    danger: string[];
  };
}

export const darkColors: ThemeColors = {
  bg: '#0f0a1e',
  bgCard: '#1a1030',
  bgElevated: '#231545',
  border: '#3d2a6e',
  borderLight: 'rgba(124,58,237,0.3)',

  primary: '#e91e8c',
  primaryDark: '#b0156a',
  primaryGlow: 'rgba(233,30,140,0.25)',

  accent: '#7c3aed',
  accentLight: '#a78bfa',
  accentGlow: 'rgba(124,58,237,0.25)',

  danger: '#ff3b3b',
  dangerGlow: 'rgba(255,59,59,0.3)',
  dangerDark: '#cc0000',

  success: '#00e676',
  successDark: '#00b248',
  successGlow: 'rgba(0,230,118,0.2)',
  warning: '#ffc107',
  warningDark: '#e6a800',

  textPrimary: '#ffffff',
  textSecondary: '#b0a8c8',
  textMuted: '#6b5f8a',

  sosRed: '#ff1744',
  sosRedGlow: 'rgba(255,23,68,0.5)',
  sosRedDark: '#c30000',
  sosRedPulse: 'rgba(255,23,68,0.15)',

  gradient: {
    sos: ['#ff1744', '#c30000'],
    primary: ['#e91e8c', '#7c3aed'],
    card: ['#1a1030', '#231545'],
    success: ['#00e676', '#00b248'],
    danger: ['#ff3b3b', '#cc0000'],
  },
};

export const lightColors: ThemeColors = {
  bg: '#f5f5fa',
  bgCard: '#ffffff',
  bgElevated: '#eeedf5',
  border: '#d4d0e0',
  borderLight: 'rgba(124,58,237,0.15)',

  primary: '#d81b72',
  primaryDark: '#a2155a',
  primaryGlow: 'rgba(216,27,114,0.12)',

  accent: '#6d28d9',
  accentLight: '#8b5cf6',
  accentGlow: 'rgba(109,40,217,0.12)',

  danger: '#ef4444',
  dangerGlow: 'rgba(239,68,68,0.12)',
  dangerDark: '#b91c1c',

  success: '#16a34a',
  successDark: '#15803d',
  successGlow: 'rgba(22,163,74,0.12)',
  warning: '#eab308',
  warningDark: '#ca8a04',

  textPrimary: '#1a1035',
  textSecondary: '#4a4463',
  textMuted: '#8e87a5',

  sosRed: '#ef4444',
  sosRedGlow: 'rgba(239,68,68,0.2)',
  sosRedDark: '#b91c1c',
  sosRedPulse: 'rgba(239,68,68,0.08)',

  gradient: {
    sos: ['#ef4444', '#b91c1c'],
    primary: ['#d81b72', '#6d28d9'],
    card: ['#ffffff', '#eeedf5'],
    success: ['#16a34a', '#15803d'],
    danger: ['#ef4444', '#b91c1c'],
  },
};

// ─── Default export (dark) for backward compatibility ────────────────────────
// Screens that haven't migrated to useAppTheme() yet can still import `colors`.
export const colors = darkColors;

// ─── Non-color tokens (shared between themes) ───────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 36,
  huge: 56,
};
