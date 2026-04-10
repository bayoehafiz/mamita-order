import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        brand: {
          cream: '#FFFBF7',
          chili: '#D42A1E',
          chiliDark: '#B02017',
          amber: '#FDE68A',
          amberSoft: '#FEF3C7',
        }
      },
      boxShadow: {
        cta: '0 -6px 16px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
} satisfies Config
