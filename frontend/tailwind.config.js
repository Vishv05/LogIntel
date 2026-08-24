/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1220', // Background
          900: '#111C30',
          850: '#17243A', // Cards
          800: '#1E2D4A',
          700: '#2A3C5E',
        },
        cyan: {
          400: '#22D3EE', // Accent
          500: '#06B6D4',
        },
        blue: {
          500: '#3B82F6',
          600: '#2563EB',
        },
        critical: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
