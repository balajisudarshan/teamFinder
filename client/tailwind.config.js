/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0b1d30',
        },
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'card': '0.75rem',
      }
    },
  },
  plugins: [],
}
