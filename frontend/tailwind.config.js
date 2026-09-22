/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f0f0f5',
          100: '#d1d1e0',
          200: '#a3a3c2',
          300: '#7575a3',
          400: '#4a4a6a',
          500: '#2d2d44',
          600: '#1e1e32',
          700: '#171728',
          800: '#111120',
          900: '#0b0b18',
          950: '#060610',
        },
        primary: {
          50: '#eef2ff',
          100: '#dbe4ff',
          200: '#bfcfff',
          300: '#93aaff',
          400: '#6b7fff',
          500: '#4f5eff',
          600: '#3b35f6',
          700: '#3129db',
          800: '#2922b0',
          900: '#26228a',
          950: '#161450',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        neon: {
          green: '#00ff88',
          blue: '#00d4ff',
          purple: '#b44dff',
          pink: '#ff4da6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0b0b18 0%, #161450 25%, #1e1e32 50%, #2d1a4e 75%, #0b0b18 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(75, 75, 130, 0.15) 0%, rgba(45, 45, 68, 0.3) 100%)',
        'glow-gradient': 'linear-gradient(135deg, #4f5eff 0%, #ec4899 50%, #00ff88 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(79, 94, 255, 0.15)',
        'glow-md': '0 0 30px rgba(79, 94, 255, 0.2)',
        'glow-lg': '0 0 60px rgba(79, 94, 255, 0.25)',
        'glow-accent': '0 0 30px rgba(236, 72, 153, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 15px rgba(79, 94, 255, 0.15)' },
          '100%': { boxShadow: '0 0 30px rgba(79, 94, 255, 0.3)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
