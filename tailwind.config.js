/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'momon-yellow': '#ffe115',
        'momon-red': '#ec0e1e',
        'momon-green': '#3a935e',
        'momon-black': '#231f20',
        'momon-white': '#ffffff',
        'momon-blue': '#3b62f6',
        'momon-shield': '#3b62f6',
        'momon-frozen': '#d6b6d4',
        'momon-magnet': '#a855f7',
      },
    },
  },
  plugins: [],
}
