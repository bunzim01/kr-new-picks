import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF8',
        text: '#1A1A1A',
        accent: '#E8B4B8'
      },
      fontFamily: {
        'noto-serif': ['Noto Serif KR', 'serif'],
        'noto-sans': ['Noto Sans KR', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
