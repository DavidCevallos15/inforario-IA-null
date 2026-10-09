import animate from 'tailwindcss-animate';

// Los colores viven como canales RGB en variables CSS (globals.css) para que
// el modo oscuro ("hoja de pizarra") cambie todo el sistema sin duplicar clases.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const TOKENS = [
  'background', 'surface', 'surface-bright', 'surface-dim',
  'surface-container-lowest', 'surface-container-low', 'surface-container',
  'surface-container-high', 'surface-container-highest', 'surface-variant',
  'primary', 'primary-container', 'primary-fixed', 'primary-fixed-dim', 'inverse-primary',
  'secondary', 'secondary-container', 'secondary-fixed', 'secondary-fixed-dim',
  'on-surface', 'on-surface-variant', 'on-primary', 'on-primary-container',
  'on-primary-fixed', 'on-primary-fixed-variant', 'on-secondary', 'on-secondary-container',
  'on-secondary-fixed', 'on-secondary-fixed-variant',
  'tertiary', 'tertiary-container', 'tertiary-fixed', 'tertiary-fixed-dim',
  'on-tertiary', 'on-tertiary-container', 'on-tertiary-fixed', 'on-tertiary-fixed-variant',
  'outline', 'outline-variant', 'error', 'error-container', 'on-error', 'on-error-container',
  'inverse-surface', 'inverse-on-surface', 'surface-tint',
  // Mundo cuaderno
  'grid', 'margin', 'pencil',
];

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(TOKENS.map((name) => [name, token(name)])),
        // Resaltadores: solo para identificar materias
        hl: {
          yellow: '#f6e84b',
          green: '#8fe39a',
          pink: '#ff9fcf',
          orange: '#ffbd6b',
          cyan: '#7fd8f3',
          lilac: '#c3b0ff',
          lime: '#d4f26b',
        },
      },
      // Sistema de esquinas: papel recto. Superficies 2-4 px, controles 6 px, chips redondos.
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
        '3xl': '12px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible Next Variable"', 'system-ui', 'sans-serif'],
        hand: ['Kalam', '"Atkinson Hyperlegible Next Variable"', 'cursive'],
      },
      // La retícula del cuaderno: 1 cuadro = 24 px
      spacing: {
        cell: '24px',
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
      transitionTimingFunction: {
        feedback: 'cubic-bezier(.3,.08,.18,1)',
        interactive: 'cubic-bezier(.2,.8,.2,1)',
        disclosure: 'cubic-bezier(.16,1,.3,1)',
        reveal: 'cubic-bezier(.32,.04,.18,1)',
      },
      // Sombras teñidas de tinta, con desplazamiento: una hoja apoyada sobre otra
      boxShadow: {
        editorial: '0 1px 0 rgb(var(--c-shadow) / 0.06), 0 10px 24px -14px rgb(var(--c-shadow) / 0.28)',
        'editorial-lg': '0 2px 0 rgb(var(--c-shadow) / 0.06), 0 22px 40px -18px rgb(var(--c-shadow) / 0.34)',
        sheet: '0 1px 0 rgb(var(--c-shadow) / 0.08), 0 18px 40px -24px rgb(var(--c-shadow) / 0.4)',
      },
    },
  },
  plugins: [animate],
};
