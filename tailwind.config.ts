import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 50px rgba(56, 189, 248, 0.18)'
      },
      backgroundImage: {
        'glass-gradient': 'radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 45%), linear-gradient(180deg, rgba(15,23,42,0.9), rgba(7,10,25,0.95))'
      }
    }
  },
  plugins: []
} satisfies Config;
