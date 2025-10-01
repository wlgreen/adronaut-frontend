import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium SaaS color palette with futuristic accents
        'surface': {
          DEFAULT: '#374151',
          hover: '#4b5563',
          subtle: '#1f2937',
        },
        'border': {
          DEFAULT: '#9ca3af',
          subtle: '#6b7280',
        },
        'primary': {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
        },
        'success': {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
        },
        'error': {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
        },
        'warning': {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
        },
        // Futuristic color system
        'electric': {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        'neon': {
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        'space': {
          100: '#1e293b',
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          800: '#0f172a',
          900: '#020617',
        },
        'accent': {
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        'heading': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'space-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
        'glow-subtle': '0 0 10px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 15px rgba(52, 211, 153, 0.5)',
        'glow-rose': '0 0 15px rgba(251, 113, 133, 0.5)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
        'inner-glow': 'inset 0 0 10px rgba(99, 102, 241, 0.3)',
        'card-elevated': '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 20px rgba(99, 102, 241, 0.1)',
        'card-primary': '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 25px rgba(99, 102, 241, 0.2)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  plugins: [],
}

export default config