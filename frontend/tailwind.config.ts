import type { Config } from 'tailwindcss';

// Design tokens — see docs/DESIGN.md for the rationale behind these choices.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0F1424', 50: '#1B2340', 100: '#141A30' }, // primary dark bg / surface
        marigold: { DEFAULT: '#F5A623', 600: '#E0921A', 700: '#B8770F' }, // primary accent — sunset / motion
        teal: { DEFAULT: '#17A398', 600: '#128A80' }, // secondary accent — routes / trust
        bone: '#F6F3EC', // light surface
        coral: '#FF6B5E', // alerts / destructive
        mpesa: { DEFAULT: '#00A859', dark: '#008C4A', light: '#10B981' }, // Official Kenya Safaricom M-PESA green
        ink_border: 'rgba(246, 243, 236, 0.08)',
        // M-Travel Luxury Palette Tokens
        mtravel: {
          burgundy: '#5C0632',
          darkBurgundy: '#3B0320',
          deepBurgundy: '#4A0427',
          gold: '#C5A059',
          brightGold: '#D4AF37',
          lightGold: '#E6C687',
          champagne: '#F7F4EE',
          obsidian: '#0B0F17',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Playfair Display"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        body: ['"Plus Jakarta Sans"', '"Satoshi"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'route-gradient': 'linear-gradient(120deg, #F5A623 0%, #FF6B5E 50%, #17A398 100%)',
        'mtravel-gradient': 'linear-gradient(135deg, #5C0632 0%, #3B0320 60%, #0F1424 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #C5A059 50%, #E6C687 100%)',
        'mpesa-gradient': 'linear-gradient(135deg, #00A859 0%, #008C4A 100%)',
        'dusk-radial': 'radial-gradient(circle at 20% 20%, rgba(92,6,50,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.15), transparent 50%)',
        'glass-3d': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(92,6,50,0.35)',
        'gold-glow': '0 0 30px rgba(212,175,55,0.3)',
        '3d-sm': '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        '3d-md': '0 12px 30px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        '3d-glow': '0 10px 40px -10px rgba(92, 6, 50, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
} satisfies Config;

