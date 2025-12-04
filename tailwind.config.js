const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Romance Colors
        romance: {
          rose: '#F43F5E',
          'rose-light': '#FDA4AF',
          'rose-dark': '#BE123C',
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
        // Warm Peach Tones
        peach: {
          DEFAULT: '#FB923C',
          light: '#FED7AA',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
        },
        // Soft Lavender
        lavender: {
          DEFAULT: '#A78BFA',
          light: '#DDD6FE',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        // Warm Backgrounds
        cream: '#FFFBEB',
        blush: '#FDF2F8',
        'warm-white': '#FEF7ED',
      },
      fontFamily: {
        display: ['Playfair Display', ...defaultTheme.fontFamily.serif],
        body: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
        mono: ['Inter', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'romantic': '0 4px 20px rgba(244, 63, 94, 0.12)',
        'glow': '0 0 40px rgba(244, 63, 94, 0.15)',
        'glass': '0 8px 32px rgba(244, 63, 94, 0.1)',
        'dreamy': '0 10px 40px rgba(167, 139, 250, 0.15)',
        'warm': '0 8px 30px rgba(251, 146, 60, 0.12)',
      },
      backgroundImage: {
        'gradient-romantic': 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 25%, #FEF3C7 75%, #FEF7ED 100%)',
        'gradient-dreamy': 'linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #FEF3C7 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FDF2F8 0%, #FEF7ED 50%, #FFF7ED 100%)',
        'gradient-rose': 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        'gradient-peach': 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F43F5E 0%, #FB923C 50%, #A78BFA 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float': 'float 3s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(244, 63, 94, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(244, 63, 94, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
