/**
 * Charte graphique Conchas : Playfair Display pour les titres, Poppins pour les textes.
 * Hiérarchie : H1/H2 Playfair Bold · H3 Poppins SemiBold · corps Poppins Regular.
 * Substitution bureautique : Georgia / Calibri.
 */
const typography = {
  fontFamily: {
    sans: 'var(--font-poppins), Poppins, Calibri, Helvetica, Arial, -apple-system, sans-serif',
    heading: 'var(--font-playfair), "Playfair Display", Georgia, var(--font-poppins), Poppins, serif',
  },

  fontSize: {
    'display-xxl': ['3.75rem', { lineHeight: '1.15', fontWeight: '700' }], // 60px — H1 Playfair Bold
    'display-xl': ['3rem', { lineHeight: '1.2', fontWeight: '700' }], // 48px — H2 Playfair Bold
    'display-lg': ['2.25rem', { lineHeight: '1.25', fontWeight: '600' }], // 36px — H3 Poppins SemiBold (via Label body path when not display)
    'display-md': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }], // 30px
    'display-sm': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }], // 24px
    'display-xs': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }], // 20px

    xl: ['1.25rem', { lineHeight: '1.6', fontWeight: '500' }], // 20px — lead Poppins Medium
    lg: ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }], // 18px
    md: ['1rem', { lineHeight: '1.65', fontWeight: '400' }], // 16px — texte courant
    sm: ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }], // 14px
    xs: ['0.75rem', { lineHeight: '1.45', fontWeight: '500' }], // 12px — caption
  },

  variants: {
    h1: 'display-xxl',
    h2: 'display-xl',
    h3: 'display-lg',
    h4: 'display-md',
    h5: 'display-sm',
    h6: 'display-xs',

    body: 'md',
    'body-lg': 'lg',
    'body-sm': 'sm',
    caption: 'xs',
    subtitle: 'lg',
    hint: 'xs',
    overline: 'xs',
  },
} as const

export default typography
