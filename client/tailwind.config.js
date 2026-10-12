/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light blue/white theme. The token names are kept from the original
        // dark theme so every existing utility class keeps working after the
        // palette swap: `midnight` = surfaces, `ivory` = text, `lime` = primary.
        midnight: {
          950: '#EEF4FF', // page background (soft blue-white)
          900: '#FFFFFF', // raised surfaces: sidebar, top nav, inputs
          800: '#FFFFFF', // cards
          700: '#E3EAF6', // subtle fills / skeletons
          600: '#CBD8EC', // borders / scrollbar
        },
        ivory: {
          DEFAULT: '#0F172A', // primary text (slate-900)
          soft: '#1E293B',
          200: '#334155',
          300: '#475569',
        },
        lime: {
          DEFAULT: '#2563EB', // primary blue
          bright: '#3B82F6',
          deep: '#1D4ED8',
        },
        lavender: {
          DEFAULT: '#4F46E5', // secondary indigo
          soft: '#6366F1',
          faint: '#EEF2FF',
        },
        accent: {
          violet: '#7C3AED',
          cyan: '#0EA5E9',
          amber: '#F59E0B',
          sky: '#38BDF8',
        },
        // Redefine Tailwind's `white` to a navy so the many translucent
        // utilities (bg-white/5, border-white/10, ...) become navy tints that
        // read correctly on a light background. Use `midnight-800` for pure
        // white. The only true white text (over video) uses text-[#fff].
        white: '#0F172A',
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(37,99,235,0.35), 0 12px 34px -10px rgba(37,99,235,0.45)',
        card: '0 1px 2px rgba(15,23,42,0.05), 0 10px 30px -14px rgba(15,23,42,0.22)',
        'card-hover': '0 1px 3px rgba(15,23,42,0.08), 0 22px 46px -16px rgba(37,99,235,0.32)',
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 6px 18px -10px rgba(15,23,42,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
        pop: 'pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.4) both',
        float: 'float 5s ease-in-out infinite',
        bob: 'bob 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};
