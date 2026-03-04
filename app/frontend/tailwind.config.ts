import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // YNAB-inspired status colors (muted, accessible)
        status: {
          positive: '#4a9d5b',
          'positive-bg': '#dff0d8',
          warning: '#c08a30',
          'warning-bg': '#fdf3d8',
          negative: '#c0392b',
          'negative-bg': '#f8d7d3',
        },
        // Claude-inspired warm accent
        accent: {
          400: '#da7756',
          500: '#C15F3C',
          600: '#ae5630',
        },
        // Minimal grays
        border: {
          light: 'rgba(0, 0, 0, 0.08)',
          dark: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 0.25rem 1.25rem rgba(0, 0, 0, 0.035)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      backgroundColor: {
        'cream': '#F5F5F0',
        'surface': '#FFFFFF',
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideIn: { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
} satisfies Config
