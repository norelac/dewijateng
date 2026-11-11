/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0D2453',
          red: '#EA4335',
          canvas: '#F7F9FC',
          muted: '#767676',
          border: '#EBEBEB',
          blue: '#3B82F6',
          lightBlue: '#DCE7F5',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        cursive: ['var(--font-montecarlo)', 'MonteCarlo', 'cursive'],
      },
    },
  },
  plugins: [],
};
