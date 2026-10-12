/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#12101A',
          900: '#17131F',
          800: '#1F1830',
          700: '#2A2140',
          600: '#372D54',
        },
        ivory: {
          DEFAULT: '#F6EFE4',
          soft: '#FBF7F0',
          200: '#EDE3D2',
          300: '#D9CBB2',
        },
        lime: {
          DEFAULT: '#C9F24B',
          bright: '#D7FF55',
          deep: '#9FCC24',
        },
        lavender: {
          DEFAULT: '#A78BFA',
          soft: '#C4B5FD',
          faint: '#2A2140',
        },
        accent: {
          violet: '#7C5CFF',
          cyan: '#22D3EE',
          amber: '#F5B62D',
        },
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(201,242,75,0.4), 0 10px 40px -10px rgba(201,242,75,0.25)',
        card: '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 28px -12px rgba(0,0,0,0.55)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.09) inset, 0 18px 44px -14px rgba(0,0,0,0.7)',
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
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
        pop: 'pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.4) both',
      },
    },
  },
  plugins: [],
};