import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Superficies
        "background":                  "#fbf9f8",
        "surface":                     "#fbf9f8",
        "surface-bright":              "#fbf9f8",
        "surface-dim":                 "#dcd9d9",
        "surface-container-lowest":    "#ffffff",
        "surface-container-low":       "#f6f3f2",
        "surface-container":           "#f0eded",
        "surface-container-high":      "#eae8e7",
        "surface-container-highest":   "#e4e2e1",
        "surface-variant":             "#e4e2e1",

        // Primario — Verde UTM
        "primary":                     "#004925",
        "primary-container":           "#006334",
        "primary-fixed":               "#a1f5b8",
        "primary-fixed-dim":           "#86d89d",
        "inverse-primary":             "#86d89d",

        // Secundario — Dorado UTM
        "secondary":                   "#7c5800",
        "secondary-container":         "#fcb812",
        "secondary-fixed":             "#ffdea7",
        "secondary-fixed-dim":         "#ffbb1e",

        // Texto sobre colores
        "on-surface":                  "#1b1c1c",
        "on-surface-variant":          "#3f4940",
        "on-primary":                  "#ffffff",
        "on-primary-container":        "#8adda1",
        "on-primary-fixed":            "#00210e",
        "on-primary-fixed-variant":    "#00522a",
        "on-secondary":                "#ffffff",
        "on-secondary-container":      "#6a4b00",
        "on-secondary-fixed":          "#271900",
        "on-secondary-fixed-variant":  "#5e4200",

        // Terciarios
        "tertiary":                    "#393f43",
        "tertiary-container":          "#50565b",
        "tertiary-fixed":              "#dee3e8",
        "tertiary-fixed-dim":          "#c1c7cc",
        "on-tertiary":                 "#ffffff",
        "on-tertiary-container":       "#c5cbd0",
        "on-tertiary-fixed":           "#161c20",
        "on-tertiary-fixed-variant":   "#41484c",

        // Sistema
        "outline":                     "#6f7a70",
        "outline-variant":             "#bfc9be",
        "error":                       "#ba1a1a",
        "error-container":             "#ffdad6",
        "on-error":                    "#ffffff",
        "on-error-container":          "#93000a",
        "inverse-surface":             "#303030",
        "inverse-on-surface":          "#f3f0f0",
        "surface-tint":                "#136c3c",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm:      "0.375rem",
        lg:      "0.5rem",
        xl:      "1.5rem",
        "2xl":   "2rem",
        "3xl":   "2.5rem",
        full:    "9999px",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
      boxShadow: {
        editorial:    "0 20px 40px rgba(0, 73, 37, 0.06)",
        "editorial-lg": "0 24px 48px rgba(0, 73, 37, 0.12)",
        "glass-nav":  "0 20px 40px rgba(0, 73, 37, 0.06)",
      },
    },
  },
  plugins: [animate],
};
