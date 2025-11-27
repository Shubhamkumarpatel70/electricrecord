/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          DEFAULT: '#FFD54F',
          light: '#FFE082',
          dark: '#FFC107',
        },
        nature: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        sky: {
          DEFAULT: '#87CEEB',
          light: '#B3E5FC',
          dark: '#64B5F6',
        },
        warm: {
          DEFAULT: '#F5F5F5',
          light: '#FAFAFA',
          dark: '#EEEEEE',
        },
        slate: {
          DEFAULT: '#37474F',
          light: '#546E7A',
          dark: '#263238',
        },
        primary: {
          DEFAULT: '#87CEEB',
          dark: '#64B5F6',
          light: '#B3E5FC',
        },
        secondary: {
          DEFAULT: '#FFD54F',
          dark: '#FFC107',
          light: '#FFE082',
        },
        success: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        warning: {
          DEFAULT: '#FFD54F',
          light: '#FFE082',
          dark: '#FFC107',
        },
        danger: {
          DEFAULT: '#F44336',
          light: '#EF5350',
          dark: '#D32F2F',
        },
        info: {
          DEFAULT: '#87CEEB',
          light: '#B3E5FC',
          dark: '#64B5F6',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)',
        'gradient-success': 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        'gradient-info': 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)',
        'gradient-solar': 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)',
        'gradient-nature': 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'large': '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

