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
    sm: '577px',
    md: '1131px',
    lg: '1201px',
    xl: '1362px',
    xxl: '1641px',
  },
} as const

export default ui
