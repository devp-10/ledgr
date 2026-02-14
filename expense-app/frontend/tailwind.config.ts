import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8B5CF6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563eb',
        },
        success: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          400: '#f87171',
          500: '#EF4444',
          600: '#dc2626',
        },
        warning: {
          400: '#fb923c',
          500: '#F97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -6px rgba(0,0,0,0.08)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.25)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
