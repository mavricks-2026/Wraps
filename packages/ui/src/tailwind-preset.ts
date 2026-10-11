import type { Config } from 'tailwindcss'

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        cream: '#f9f5ef',
        brand: {
          50: '#fbf7f0',
          100: '#f5ebd9',
          200: '#e9d6b1',
          300: '#d4b682',
          500: '#a07d4a',
          700: '#6b5232',
          900: '#3a2c1a',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
}

export default preset