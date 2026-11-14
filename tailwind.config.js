/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arena: {
          950: '#060913',
          900: '#0B0F19',
          850: '#0F1626',
          800: '#141D32',
          750: '#1B2642',
          700: '#233256',
          600: '#334878',
        },
        electric: {
          blue: '#38BDF8',
          cyan: '#06B6D4',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          purple: '#A855F7',
          pink: '#EC4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.35)' },
        }
      }
    },
  },
  plugins: [],
}
