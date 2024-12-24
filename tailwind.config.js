import tailwindcssLogical from 'tailwindcss-logical'

// import customTailwindPlugin from './src/@core/tailwind/plugin.js'

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,css}'],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [tailwindcssLogical],
  theme: {
    extend: {}
  }
}

export default config
