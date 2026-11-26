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
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Spec 8.3 Design Tokens
        ink: '#121212',
        paper: '#F7F6F2',
        card: '#FFFFFF',
        line: '#E4E1D8',
        muted: '#5C5A55',
        accent: '#6C2BD9',
        'accent-soft': '#EFE8FD',
        money: '#C8F04B',
        success: '#1F9D55',
        warning: '#E8A317',
        error: '#D93025',
        // Legacy aliases preserved for subpages prior to Etappe 5
        'geo-green': '#C8F04B',
        'geo-green-deep': '#1F9D55',
        'green-deep': '#1F9D55',
        'geo-violet': '#6C2BD9',
        'geo-violet-soft': '#A870E0',
        void: '#121212',
        surface: '#F7F6F2',
        'surface-2': '#EFEFEC',
        'ink-soft': '#5C5A55',
        hairline: '#E4E1D8',
      },
      borderRadius: {
        input: '12px',
        card: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,18,18,.06), 0 8px 24px rgba(18,18,18,.06)',
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
