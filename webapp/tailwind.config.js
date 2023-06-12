/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "azure-blue": "#0078d4",
        "azure-blue-dark": "#106ebe",
      },
    },
  },
  plugins: [],
};
