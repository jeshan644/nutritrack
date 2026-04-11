/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#0f0f0f',
        card: '#1a1a1a',
        card2: '#222222',
        border: '#2a2a2a',
        green: { DEFAULT: '#4ade80', dark: '#22c55e' },
        orange: { DEFAULT: '#f97316' },
        protein: '#60a5fa',
        carbs: '#f97316',
        fat: '#facc15',
        fiber: '#a78bfa',
        primary: '#f5f5f5',
        muted: '#888888',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        pill: '999px',
      },
    },
  },
  plugins: [],
}
