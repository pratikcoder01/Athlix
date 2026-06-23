/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dojo: {
          dark: '#0d0d1a',       // Midnight sports-tech blue
          card: '#1a1a2e',       // Navy-grey card BG
          border: '#2e2e4f',     // Dark slate grid border
          primary: '#e74c3c',    // Alizarin Red (combat sports)
          secondary: '#f39c12',  // Orange-gold (achievements / belts)
          success: '#27ae60',    // Emerald Green (approved booking)
          text: '#ffffff',       // High-contrast white
          muted: '#a0a0b0',      // Muted secondary text
        },
        athlix: {
          dark: '#0D0D1A',       // Deep midnight titanium
          card: '#1A1A2E',       // Combat sleek charcoal blue
          border: '#2E2E4F',     // Dark slate grid border
          primary: '#E74C3C',    // Crimson Red
          secondary: '#F39C12',  // Belt Gold
          success: '#27AE60',    // Success Emerald
          text: '#FFFFFF',
          muted: '#A0A0B0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(231, 76, 60, 0.4)',
        'glow-gold': '0 0 20px rgba(243, 156, 18, 0.4)',
      }
    },
  },
  plugins: [],
}
