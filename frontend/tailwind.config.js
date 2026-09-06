/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#eef9ff',  100: '#d8f1ff', 200: '#b9e6ff',
          300: '#89d7fe', 400: '#53c2fc', 500: '#2ba8f9',
          600: '#1589ea', 700: '#0d6dc9', 800: '#1258a4', 900: '#154c82',
        },
        marine: {
          50: '#f0fdf9',  900: '#0a2e26',
        },
        hazard: {
          low: '#22c55e', moderate: '#f59e0b', high: '#ef4444', critical: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
