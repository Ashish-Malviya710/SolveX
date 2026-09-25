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
        // Obsidian & Phosphor Violet Theme Tokens
        obsidian: '#000000',
        graphite: '#121212',
        onyx: '#1e1e1d',
        carbon: '#333333',
        'slate-deep': '#40403f',
        bone: '#faf9f6',
        paper: '#ffffff',
        'ash-light': '#e3e2e0',
        'ash-mid': '#b4b4b2',
        ash: '#868684',
        'ash-mute': '#a0a0a0',
        iron: '#666469',
        ink: '#080808',
        'phosphor-violet': '#cbb0f7',
        violet: '#cbb0f7',

        // System & Surface Aliases
        void: '#000000',         // Obsidian canvas
        canvas: '#000000',       // Primary page canvas
        hairline: '#1e1e1d',     // Onyx subtle border
        steel: '#40403f',        // Slate Deep
        smoke: '#b4b4b2',        // Ash Mid body copy
        fog: '#868684',          // Ash tertiary text & captions

        // Phosphor Violet Accent (decorative highlights & badges)
        lime: {
          DEFAULT: '#cbb0f7',    // Phosphor violet accent
          glow: 'rgba(203, 176, 247, 0.35)',
          dark: '#332845',
          ink: '#191424',
        },

        // Dark elevation scale
        dark: {
          50: '#faf9f6',         // bone
          100: '#e3e2e0',        // ash-light
          200: '#b4b4b2',        // ash-mid
          300: '#868684',        // ash
          400: '#666469',        // iron
          500: '#40403f',        // slate-deep
          600: '#333333',        // carbon
          700: '#1e1e1d',        // onyx
          800: '#1e1e1d',        // onyx
          900: '#121212',        // graphite
          950: '#000000',        // obsidian
        },
        primary: {
          50: '#f8f5fe',
          100: '#f1ebfd',
          200: '#e4d6fb',
          300: '#d7c1f9',
          400: '#cbb0f7',        // Phosphor violet
          500: '#cbb0f7',
          600: '#b391ee',
          700: '#9b71e4',
          800: '#4a376a',
          900: '#2c2041',
          950: '#191424',
        },
        accent: {
          50: '#f8f5fe',
          100: '#f1ebfd',
          200: '#e4d6fb',
          300: '#d7c1f9',
          400: '#cbb0f7',
          500: '#cbb0f7',
          600: '#b391ee',
          700: '#9b71e4',
          800: '#4a376a',
          900: '#2c2041',
          950: '#191424',
        },
        neon: {
          green: '#10b981',
          blue: '#38bdf8',
          purple: '#cbb0f7',
          pink: '#f472b6',
        },
      },
      borderRadius: {
        cards: '8px',
        buttons: '8px',
        inputs: '6px',
        tags: '4px',
        pills: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Inconsolata', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 14px rgba(203, 176, 247, 0.20)',
        'glow-md': '0 0 24px rgba(203, 176, 247, 0.32)',
        'glow-lg': '0 0 40px rgba(203, 176, 247, 0.45)',
        'card-inset': 'rgba(0, 0, 0, 0.25) 0px 4px 4px 0px, rgba(0, 0, 0, 0.35) 0px 4px 25px 0px inset',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.75)',
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'cursor-blink': 'cursor-blink 1s step-start infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      maxWidth: {
        page: '1200px',
      },
    },
  },
  plugins: [],
};
