/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 3.9%)',
        card: 'hsl(0 0% 100%)',
        'card-foreground': 'hsl(0 0% 3.9%)',
        popover: 'hsl(0 0% 100%)',
        'popover-foreground': 'hsl(0 0% 3.9%)',
        primary: 'hsl(0 0% 9%)',
        'primary-foreground': 'hsl(0 0% 98%)',
        secondary: 'hsl(0 0% 96.1%)',
        'secondary-foreground': 'hsl(0 0% 9%)',
        muted: 'hsl(0 0% 96.1%)',
        'muted-foreground': 'hsl(0 0% 45.1%)',
        accent: 'hsl(0 0% 96.1%)',
        'accent-foreground': 'hsl(0 0% 9%)',
        destructive: 'hsl(0 84.2% 60.2%)',
        'destructive-foreground': 'hsl(0 0% 98%)',
        border: 'hsl(0 0% 89.8%)',
        input: 'hsl(0 0% 89.8%)',
        ring: 'hsl(0 0% 3.9%)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
