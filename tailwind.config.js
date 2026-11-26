/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter Variable"', 'Inter', 'Arial', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'Arial', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // ugcVZ Brand Kit v1.0 Tokens (Directory Blue + Creator Red)
        'brand-primary': '#06458F',
        'brand-primary-hover': '#053673',
        'brand-primary-soft': '#EBF2FA',
        'brand-accent': '#F2072A',
        'brand-accent-dark': '#D10523',
        'brand-accent-soft': '#FDECEF',
        ink: '#202124',
        paper: '#F5F7FA',
        card: '#FFFFFF',
        line: '#DCE2EA',
        muted: '#5C6470',
        accent: '#06458F',
        'accent-soft': '#EBF2FA',
        money: '#EBF2FA',
        success: '#1F9D55',
        warning: '#E8A317',
        error: '#D93025',
        // Legacy aliases cleanly mapped onto ugcVZ Brand Kit
        'geo-green': '#1F9D55',
        'geo-green-deep': '#157347',
        'green-deep': '#157347',
        'geo-violet': '#06458F',
        'geo-violet-soft': '#053673',
        void: '#062A59',
        surface: '#F5F7FA',
        'surface-2': '#EAEFF5',
        'ink-soft': '#5C6470',
        hairline: '#DCE2EA',
      },
      borderRadius: {
        input: '8px',
        button: '8px',
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(6, 69, 143, 0.05), 0 6px 20px rgba(32, 33, 36, 0.06)',
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
