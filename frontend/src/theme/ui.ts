const ui = {
  radius: {
    none: '0',
    xs: '0.125rem',  // 2px
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    xxl: '1rem',     // 16px
  },

  breakPoints: {
    xs: { max: '576px' },
    sm: { min: '577px', max: '1130px' },
    md: { min: '1131px', max: '1200px' },
    lg: { min: '1201px', max: '1361px' },
    xl: { min: '1362px', max: '1640px' },
    xxl: { min: '1641px' },
  },
} as const

export default ui
