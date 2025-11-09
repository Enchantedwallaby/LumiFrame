/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5A3FFF",     // Main vibrant violet
        accent: "#9D6CFF",      // Soft glowing accent
        dark: "#120C1F",        // Background base
        mid: "#2E1A47",         // Mid purple for card backgrounds
        light: "#EDE9FF",       // Text/light tones
        soft: "#C5A3FF",        // Subtle glow
      },
      fontFamily: {
        sans: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
        display: ['"Outfit"', 'Poppins', 'ui-sans-serif'],
      },
      backgroundImage: {
        'gradient-main': "linear-gradient(135deg, #120C1F 0%, #2E1A47 50%, #5A3FFF 100%)",
        'gradient-card': "linear-gradient(145deg, rgba(46,26,71,0.8), rgba(18,12,31,0.9))",
        'gradient-button': "linear-gradient(90deg, #5A3FFF 0%, #9D6CFF 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(157,108,255,0.5)",
      },
    },
  },
  plugins: [],
};
