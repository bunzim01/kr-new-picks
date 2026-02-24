import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 디자인 팔레트
        background: '#FAFAF8',
        charcoal: '#1A1A1A',
        blush: '#E8B4B8',
        'blush-light': '#F5D6D8',
        'blush-dark': '#D4919A',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      aspectRatio: {
        'product': '3 / 4',
      },
    },
  },
  plugins: [],
}
export default config
