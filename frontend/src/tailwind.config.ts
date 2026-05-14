import type { Config } from 'tailwindcss'
import colors from './theme/colors'
import spacing from './theme/spacings'
import typography from './theme/typography'
import ui from './theme/ui'
import zIndex from './theme/zIndex'
import shadows from './theme/shadows'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: {
        display: ['var(--font-sans)', 'sans-serif'],
      },
      fontSize: typography.fontSize,
      borderRadius: ui.radius,
      screens: {
        xs: { max: '576px' },
        sm: '577px',
        md: '1131px',
        lg: '1201px',
        xl: '1362px',
        xxl: '1641px',
      },
      zIndex: zIndex,
      boxShadow: shadows,
    },
  },
  plugins: [],
}
export default config
