/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinical: {
          ink: "#1f2937",
          muted: "#667085",
          line: "#d0d5dd",
          panel: "#f8fafc",
          teal: "#0f766e"
        }
      }
    }
  },
  plugins: []
};

