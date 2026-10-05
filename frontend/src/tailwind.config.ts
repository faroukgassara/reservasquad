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
