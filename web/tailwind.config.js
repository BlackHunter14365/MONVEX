/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* MONVEX Reference Design Palette */
        background: 'var(--mx-background)',
        sidebar: 'var(--mx-sidebar)',
        surface: {
          DEFAULT: 'var(--mx-surface)',
          subtle: 'var(--mx-surface-subtle)',
          muted: 'var(--mx-surface-muted)',
          raised: 'var(--mx-surface-raised)',
          overlay: 'var(--mx-surface-overlay)',
          50: 'var(--mx-surface-subtle)',
          100: 'var(--mx-surface)',
          200: 'var(--mx-surface-muted)',
          300: 'var(--mx-surface-raised)',
          border: 'var(--mx-border)',
          'border-strong': 'var(--mx-border-strong)',
        },
        text: {
          primary: 'var(--mx-text-primary)',
          secondary: 'var(--mx-text-secondary)',
          muted: 'var(--mx-text-muted)',
          disabled: 'var(--mx-text-disabled)',
        },
        border: {
          DEFAULT: 'var(--mx-border)',
          strong: 'var(--mx-border-strong)',
          interactive: 'var(--mx-border-interactive)',
        },
        accent: {
          DEFAULT: 'var(--mx-accent)',
          hover: 'var(--mx-accent-hover)',
          soft: 'var(--mx-accent-soft)',
          blue: 'var(--mx-brand-blue)',
          'blue-soft': 'var(--mx-brand-blue-soft)',
        },
        brand: {
          DEFAULT: '#172033',
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
        },
        success: {
          DEFAULT: 'var(--mx-success)',
          soft: 'var(--mx-success-soft)',
          border: 'var(--mx-success-border)',
        },
        warning: {
          DEFAULT: 'var(--mx-warning)',
          soft: 'var(--mx-warning-soft)',
          border: 'var(--mx-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--mx-danger)',
          soft: 'var(--mx-danger-soft)',
          border: 'var(--mx-danger-border)',
        },
        cat: {
          food: 'var(--mx-cat-food)',
          'food-text': 'var(--mx-cat-food-text)',
          shop: 'var(--mx-cat-shop)',
          'shop-text': 'var(--mx-cat-shop-text)',
          bills: 'var(--mx-cat-bills)',
          'bills-text': 'var(--mx-cat-bills-text)',
          trans: 'var(--mx-cat-trans)',
          'trans-text': 'var(--mx-cat-trans-text)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--mx-radius-sm)',
        md: 'var(--mx-radius-md)',
        lg: 'var(--mx-radius-lg)',
        xl: 'var(--mx-radius-xl)',
        full: 'var(--mx-radius-full)',
      },
      boxShadow: {
        subtle: 'var(--mx-shadow-subtle)',
        card: 'var(--mx-shadow-card)',
        elevated: 'var(--mx-shadow-elevated)',
        modal: 'var(--mx-shadow-modal)',
      },
    },
  },
  plugins: [],
};
