/**
 * Charte graphique Biblio Squad : Bricolage Grotesque pour les titres (style signalétique
 * de bibliothèque), Inter pour les textes et les chiffres (chiffres tabulaires).
 * Hiérarchie : H1 Bold · H2 SemiBold · H3 Medium ·
 * lead Inter Medium · corps Inter Regular · caption Inter Medium.
 * Substitution bureautique : Arial / Calibri.
 * Arabe : Cairo pour les titres, IBM Plex Sans Arabic pour les textes.
 */
const typography = {
  // Resolved in globals.css so the Arabic locale can swap families.
  fontFamily: {
    sans: 'var(--ds-font-sans)',
    heading: 'var(--ds-font-heading)',
  },

  fontSize: {
    'display-xxl': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }], // 60px — H1 Bold
    'display-xl': ['3rem', { lineHeight: '1.15', fontWeight: '600' }], // 48px — H2 SemiBold
    'display-lg': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }], // 36px — H3 SemiBold
    'display-md': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }], // 30px
    'display-sm': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }], // 24px
    'display-xs': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }], // 20px

    xl: ['1.25rem', { lineHeight: '1.6', fontWeight: '500' }], // 20px — lead Inter Medium
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
