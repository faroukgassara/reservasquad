const typography = {
  fontFamily: {
    sans: "'Inter', sans-serif",
    display: "'Bebas Neue', sans-serif",
  },

  fontSize: {
    // Display / Hero
    'display-xxl': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }], // 60px
    'display-xl': ['3rem', { lineHeight: '1.1', fontWeight: '700' }], // 48px
    'display-lg': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }], // 36px
    'display-md': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }], // 30px
    'display-sm': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // 24px
    'display-xs': ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }], // 20px

    // Text
    xl: ['1.25rem', { lineHeight: '1.6', fontWeight: '500' }], // 20px
    lg: ['1.125rem', { lineHeight: '1.6', fontWeight: '500' }], // 18px
    md: ['1rem', { lineHeight: '1.6', fontWeight: '400' }], // 16px
    sm: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
    xs: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }], // 12px
  },

  variants: {
    // Headings
    h1: 'display-xxl',
    h2: 'display-xl',
    h3: 'display-lg',
    h4: 'display-md',
    h5: 'display-sm',
    h6: 'display-xs',

    // Text
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
