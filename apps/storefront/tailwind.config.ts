import type { Config } from 'tailwindcss'
import preset from '@goodsly/ui/tailwind-preset'

const config: Config = {
  presets: [preset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FCF6FC',
        surface: '#FFFFFF',
        tint: '#F7EAF6',
        line: '#EBD0E9',
        ink: '#2B1A29',
        muted: '#6E5A6C',
        pink: {
          DEFAULT: '#B96CB4',
          soft: '#FDE0F5',
          strong: '#A459A0',
          wash: '#F5E0F3',
        },
        plum: {
          DEFAULT: '#854880',
          deep: '#6E3A6A',
          ink: '#271625',
        },
        blush: '#FFD7F6',
        soft: '#FDE0F5',
        wash: '#F5E0F3',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-quicksand)', 'Quicksand', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        control: '14px',
        image: '18px',
      },
      boxShadow: {
        soft: '0 4px 18px -2px rgba(185, 108, 180, 0.12)',
        card: '0 10px 25px -4px rgba(185, 108, 180, 0.12), 0 4px 10px -2px rgba(185, 108, 180, 0.08)',
        lift: '0 18px 32px -4px rgba(185, 108, 180, 0.22)',
        glow: '0 8px 24px rgba(185, 108, 180, 0.35)',
        rise: '0 -4px 20px rgba(133, 72, 128, 0.15)',
      },
      fontSize: {
        display: [
          'clamp(2.125rem, 1.5rem + 2.6vw, 2.75rem)',
          { lineHeight: '1.15', fontWeight: '600' },
        ],
        h1: ['clamp(1.75rem, 1.35rem + 1.8vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '600' }],
        h2: ['clamp(1.5rem, 1.25rem + 1.1vw, 2rem)', { lineHeight: '1.25', fontWeight: '600' }],
        h3: ['clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],
        body: ['1rem', { lineHeight: '1.625' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
      },
      backgroundImage: {
        'wash-hero':
          'radial-gradient(ellipse 80% 60% at 50% 0%, #FDEEFB 0%, #FCF6FC 55%, #FFFFFF 100%)',
        'wash-soft': 'radial-gradient(ellipse at center, #F7EAF6 0%, #FCF6FC 72%)',
        'wash-pink': 'linear-gradient(135deg, #B96CB4 0%, #854880 100%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        fadeUp: 'fadeUp 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
