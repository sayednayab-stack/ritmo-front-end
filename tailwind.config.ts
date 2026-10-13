import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-garamond)', 'EB Garamond', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        /* ── Canvas ── */
        'ops-bg':    '#F7F5F3',
        'ops-card':  '#FFFFFF',
        'ops-card2': '#F1EEE9',
        'ops-line':  '#E8E4DD',

        /* ── Brand navy ── */
        'brand-blue':      '#072D62',
        'brand-wine':      '#072D62',
        'brand-wine-hover':'#0E3F82',
        'brand-blue-deep': '#04204A',
        'navy-soft':       '#E8EEF7',

        /* ── Gold accent ── */
        'accent-gold': '#B39661',
        'gold-soft':   '#F5EEDF',

        /* ── Text ── */
        'text-primary':   '#072D62',
        'text-secondary': '#636874',
        'text-tertiary':  '#8A909C',

        /* ── Status ── */
        'success':      '#1F7A44',
        'success-soft': '#E6F2EA',
        'alert-amber':  '#C68A3E',
        'amber-soft':   '#FBF1E1',
        'danger':       '#C4432B',
        'danger-soft':  '#FBE9E5',

        /* ── Border ── */
        'border': '#DCDFE4',

        /* Keep Tailwind primary/secondary for internal compatibility */
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#072D62',
          700: '#04204A',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50:  '#F7F5F3',
          100: '#F1EEE9',
          200: '#E8E4DD',
          300: '#DCDFE4',
          400: '#8A909C',
          500: '#636874',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#072D62',
        },
      },
      boxShadow: {
        'soft':       '0 1px 2px rgba(7,45,98,.04), 0 2px 8px rgba(7,45,98,.05)',
        'lift':       '0 4px 12px rgba(7,45,98,.08), 0 14px 32px rgba(7,45,98,.1)',
        'modal':      '0 24px 64px rgba(4,32,74,.28), 0 4px 16px rgba(4,32,74,.12)',
        'inset-top':  'inset 0 1px 0 rgba(255,255,255,.14)',
        'input':      'inset 0 1px 1px rgba(7,45,98,.03)',
        /* compat aliases */
        'card':       '0 1px 2px rgba(7,45,98,.04), 0 2px 8px rgba(7,45,98,.05)',
        'card-md':    '0 4px 12px rgba(7,45,98,.08), 0 14px 32px rgba(7,45,98,.1)',
        'card-lg':    '0 24px 64px rgba(4,32,74,.28), 0 4px 16px rgba(4,32,74,.12)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg,#0A3470 0%,#072D62 45%,#04204A 100%)',
        'btn-navy':         'linear-gradient(180deg,#0E3F82 0%,#072D62 100%)',
        'btn-danger':       'linear-gradient(180deg,#D14E34 0%,#C4432B 100%)',
        'ops-grid':         'linear-gradient(rgba(7,45,98,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(7,45,98,.03) 1px,transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'rise-in':    'riseIn .5s cubic-bezier(.16,1,.3,1) both',
        'fade-in':    'fadeIn .2s ease-out both',
        'scale-in':   'scaleIn .22s cubic-bezier(.34,1.56,.64,1) both',
        'menu-in':    'menuIn .18s cubic-bezier(.16,1,.3,1) both',
        'slide-up':   'slideUp .22s cubic-bezier(.16,1,.3,1) both',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s infinite',
        'pulse':      'pulse 2s cubic-bezier(.4,0,.6,1) infinite',
      },
      keyframes: {
        riseIn:     { from: { opacity:'0', transform:'translateY(14px) scale(.985)' }, to: { opacity:'1', transform:'translateY(0) scale(1)' } },
        fadeIn:     { from: { opacity:'0' }, to: { opacity:'1' } },
        scaleIn:    { from: { opacity:'0', transform:'scale(.95) translateY(2px)' }, to: { opacity:'1', transform:'scale(1) translateY(0)' } },
        menuIn:     { from: { opacity:'0', transform:'scale(.97) translateY(-6px)' }, to: { opacity:'1', transform:'scale(1) translateY(0)' } },
        slideUp:    { from: { opacity:'0', transform:'translateY(8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        floatSlow:  { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-18px)' } },
        shimmer:    { from: { backgroundPosition:'200% 0' }, to: { backgroundPosition:'-200% 0' } },
      },
      transitionTimingFunction: {
        'expo-out':  'cubic-bezier(.16,1,.3,1)',
        'spring':    'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
}
export default config
