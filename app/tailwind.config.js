import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'client/index.html'),
    path.join(__dirname, 'client/src/**/*.{vue,js}'),
  ],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1E2761', deep: '#141C44', soft: '#3A4691' },
        ice:    '#CADCFC',
        coral:  { DEFAULT: '#F96167', soft: '#FDE7E8' },
        teal:   { DEFAULT: '#028090', soft: '#D8ECEE' },
        amber:  { DEFAULT: '#D97706', soft: '#FEF3C7' },
        offwhite: '#F5F7FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
