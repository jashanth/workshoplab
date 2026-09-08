/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kali: {
          primary: '#367bf0',
          dark: '#0a0e27',
          darker: '#050810',
          panel: '#1a1f36',
          border: '#2d3548',
          text: '#e6e8f0',
          accent: '#00d9ff',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
