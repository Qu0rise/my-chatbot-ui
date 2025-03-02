import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      backgroundColor: {
        'custom-pink': '#F092AC',
        'custom-black': '#222222',
      },
      textColor: {
        'custom-pink': '#F092AC',
        'custom-black': '#222222',
      },
    },
  },
  plugins: [],
} satisfies Config;
