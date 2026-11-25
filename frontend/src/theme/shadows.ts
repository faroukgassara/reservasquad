// Tinted with Bleu Nuit (#253165) rather than neutral black so elevation reads as part of the palette.
const shadows = {
  xs: '0px 1px 2px 0px hsla(229, 46%, 20%, 0.05)',
  sm: '0px 1px 2px 0px hsla(229, 46%, 20%, 0.06), 0px 1px 3px 0px hsla(229, 46%, 20%, 0.04)',
  md: '0px 1px 2px 0px hsla(229, 46%, 20%, 0.06), 0px 4px 12px -4px hsla(229, 46%, 20%, 0.12)',
  lg: '0px 2px 4px 0px hsla(229, 46%, 20%, 0.06), 0px 12px 24px -8px hsla(229, 46%, 20%, 0.18)',
  xl: '0px 4px 8px 0px hsla(229, 46%, 20%, 0.06), 0px 20px 40px -12px hsla(229, 46%, 20%, 0.22)',
  xxl: '0px 24px 48px -12px hsla(229, 46%, 20%, 0.2)',
  xxxl: '0px 32px 64px -12px hsla(229, 46%, 20%, 0.16)',
} as const

export default shadows
