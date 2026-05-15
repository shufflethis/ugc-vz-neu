/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'geo-green': '#A8E06A',
        'geo-green-deep': '#6FA82E',
        'green-deep': '#6FA82E',
        'geo-violet': '#8B3FCA',
        'geo-violet-soft': '#A870E0',
        'void': '#060606',
        'surface': '#F7F7F5',
        'surface-2': '#EFEFEC',
        'ink': '#171717',
        'ink-soft': '#5A5A5A',
        'hairline': '#E8E8E4',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dot-pulse': 'dot-pulse 1.4s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
