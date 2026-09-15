import type { Config } from 'tailwindcss';

// Design tokens — see docs/DESIGN.md for the rationale behind these choices.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bright Slate & Neutral Foundation
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAF8F5',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        ink: { DEFAULT: '#0F172A', 50: '#F8FAFC', 100: '#F1F5F9' }, // crisp high-contrast dark text
        marigold: { DEFAULT: '#D97706', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' }, // Savannah Gold
        teal: { DEFAULT: '#0D9488', 600: '#0F766E' },
        bone: '#0F172A', // crisp high-contrast dark text for all surfaces
        coral: '#EF4444',
        mpesa: { DEFAULT: '#059669', dark: '#047857', light: '#10B981' }, // Official Kenya M-PESA
        ink_border: '#CBD5E1',

        // M-Travel Luxury Brand Palette (Savannah Gold & Imperial Garnet)
        safari: {
          50: '#FFFDF9',
          100: '#FEF9EE',
          200: '#FDF1D7',
          300: '#FBE2AD',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        garnet: {
          DEFAULT: '#831843',
          light: '#9D174D',
          dark: '#500724',
        },
        mtravel: {
          burgundy: '#831843',
          darkBurgundy: '#500724',
          deepBurgundy: '#701A75',
          gold: '#D97706',
          brightGold: '#F59E0B',
          lightGold: '#D97706',
          champagne: '#FEF3C7',
          obsidian: '#0F172A',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Outfit"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        body: ['"Plus Jakarta Sans"', '"Satoshi"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
        'safari-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 100%)',
        'luxe-gradient': 'linear-gradient(135deg, #831843 0%, #9D174D 100%)',
        'mpesa-gradient': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'subtle-glow': 'radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.08) 0%, transparent 70%)',
        'card-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
      },
      boxShadow: {
        luxe: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'luxe-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(217, 119, 6, 0.18)',
        card: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 16px 32px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        float: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
        'gold-glow': '0 10px 25px -5px rgba(217, 119, 6, 0.35)',
        '3d-sm': '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        '3d-md': '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        '3d-glow': '0 12px 40px -8px rgba(217, 119, 6, 0.15)',
        glass: '0 8px 30px rgba(0,0,0,0.06)',
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.5rem' },
    },
  },
  plugins: [],
} satisfies Config;

