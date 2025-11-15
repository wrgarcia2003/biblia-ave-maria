/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b9c6d9',
          300: '#89a3bf',
          400: '#577a9a',
          500: '#305e80',
          600: '#214a68',
          700: '#163a55',
          800: '#0f2e45',
          900: '#0c2538'
        },
        accent: {
          50: '#faf5e8',
          100: '#f3e7c2',
          200: '#ead493',
          300: '#dfbe61',
          400: '#d4aa3f',
          500: '#cfa23a',
          600: '#b8892b',
          700: '#9a6c21',
          800: '#7b551a',
          900: '#604114'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        }
      }
    },
  },
  plugins: [],
}
