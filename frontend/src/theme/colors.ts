/** Reserva Squad brand: navy #253165 (primary), red #E5191D (accent / CTAs). */

const colors = {
  white: '#ffffff',
  black: '#1a1d24',

  gray: {
    25: '#fcfcfd',
    50: '#f5f6f8',
    100: '#eceef2',
    200: '#d5d9e2',
    300: '#b3b9c8',
    400: '#8b94a8',
    500: '#6b7388',
    600: '#565c6e',
    700: '#474c5a',
    800: '#3d414d',
    900: '#353842',
  },

  primary: {
    /** Near-white tint for muted backgrounds (`bg-primary-10/20`) */
    10: '#f8fafc',
    25: '#f7f8fc',
    50: '#eff1f9',
    100: '#dfe4f0',
    200: '#c5cde3',
    300: '#9eaccc',
    400: '#7788b5',
    500: '#5a6c9e',
    600: '#475986',
    700: '#3a4a73',
    800: '#304061',
    900: '#253165',
  },

  /** Brand red — active nav, danger, highlights */
  accent: {
    25: '#fff5f5',
    50: '#ffecec',
    100: '#ffd4d5',
    200: '#ffa8aa',
    300: '#f2686b',
    400: '#e83035',
    500: '#E5191D',
    600: '#c41418',
    700: '#9f1014',
    800: '#7a0d10',
    900: '#5c0a0c',
  },

  danger: {
    25: '#fff5f5',
    50: '#ffecec',
    100: '#ffd4d5',
    200: '#ffa8aa',
    300: '#f2686b',
    400: '#e83035',
    500: '#E5191D',
    600: '#c41418',
    700: '#9f1014',
    800: '#7a0d10',
    900: '#5c0a0c',
  },

  success: {
    25: '#f0fdf6',
    50: '#dcfce9',
    100: '#bbf7d4',
    200: '#86efad',
    300: '#4ade80',
    400: '#22c55e',
    500: '#16a34a',
    600: '#15803c',
    700: '#166534',
    800: '#14532d',
    900: '#14532d',
  },

  warning: {
    25: '#fffbeb',
    50: '#fef3c7',
    100: '#fde68a',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },

  overlay: {
    fonce: 'oklch(0.1949 0.0039 106.76 / 0.7)',
  },

  error: '#E5191D',

  secondary: {
    'gris-fonce': '#253165',
    'gris-clair': '#eff1f9',
  },
} as const

export default colors
