import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 300: '#c4b5fd', 400: '#a78bfa', 500: '#7C3AED', 600: '#6D28D9' },
        accent:  { 300: '#67e8f9', 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2' },
        success: { 400: '#34D399', 500: '#10B981', 600: '#059669' },
        danger:  { 400: '#f87171', 500: '#EF4444', 600: '#dc2626' },
        warning: { 400: '#fb923c', 500: '#F97316', 600: '#ea580c' },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card':        '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 32px rgba(0,0,0,0.5)',
        'card-hover':  '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.35)',
        'glow-violet': '0 0 30px rgba(124,58,237,0.45), 0 0 60px rgba(124,58,237,0.15)',
        'glow-cyan':   '0 0 30px rgba(34,211,238,0.35)',
        'glow-sm':     '0 0 14px rgba(124,58,237,0.35)',
        'light-card':  '0 1px 3px rgba(0,0,0,0.06)',
        'light-hover': '0 8px 25px -5px rgba(0,0,0,0.12)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':  'fadeIn 0.25s ease-out',
        'shimmer':  'shimmer 2s linear infinite',
        'count-up': 'countUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'float':    'float 6s ease-in-out infinite',
      },
      keyframes: {
        slideIn:  { '0%': { opacity:'0', transform:'translateX(16px)' },  '100%': { opacity:'1', transform:'translateX(0)' } },
        fadeIn:   { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        shimmer:  { '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
        countUp:  { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        float:    { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
