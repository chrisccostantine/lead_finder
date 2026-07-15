/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#09090b',
        panel: '#111113',
        line: '#27272a',
      },
      boxShadow: {
        glow: '0 0 60px rgba(139, 92, 246, 0.12)',
      },
    },
  },
  plugins: [],
};

