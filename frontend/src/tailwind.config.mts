import type { Config } from 'tailwindcss'
import colors from './theme/colors'
import spacing from './theme/spacings'
import typography from './theme/typography'
import ui from './theme/ui'
import zIndex from './theme/zIndex'
import shadows from './theme/shadows'

type Shade = string
type Palette = { [key: string]: Shade | Palette }

// Every shade resolves to a CSS variable defined in globals.css (:root = light, .dark = dark),
// so the whole app flips theme without per-file dark: classes.
const cssVarPalette = (palette: Palette, prefix = ''): Palette =>
  Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [
      key,
      typeof value === 'string' ? `var(--ds-${prefix}${key})` : cssVarPalette(value, `${prefix}${key}-`),
    ]),
  )

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: cssVarPalette(colors) as typeof colors,
      spacing,
      fontSize: typography.fontSize,
      borderRadius: ui.radius,
      screens: ui.breakPoints,
      zIndex: zIndex,
      boxShadow: shadows,
    },
  },
  plugins: [],
}
export default config
