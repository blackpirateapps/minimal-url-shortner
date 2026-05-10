/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        fontFamily: {
            display: ['Cinzel', 'serif'],
            serif: ['Spectral', 'serif'],
            mono: ['Fira Code', 'monospace'],
        },
        borderRadius: {
            none: '0',
            sm: '2px',
            DEFAULT: '4px',
            md: '6px',
            lg: '8px',
            xl: '8px',
            '2xl': '8px',
            full: '9999px',
        },
        extend: {
            colors: {
                white: '#F5E6D3',
                black: '#1A0F0A',
                quest: {
                    bg: '#1A0F0A',
                    surface: '#2C1A10',
                    elevated: '#3D2517',
                    border: '#5C3D2E',
                    muted: '#BFA98A',
                    parchment: '#F5E6D3',
                    gold: '#CA8A04',
                    goldLight: '#DAA520',
                    goldDark: '#B8780A',
                    red: '#991B1B',
                    redLight: '#B91C1C',
                    redSoft: '#F87171',
                    purple: '#581C87',
                    success: '#22C55E',
                },
                dark: {
                    900: '#1A0F0A',
                    800: '#2C1A10',
                    700: '#3D2517',
                    600: '#5C3D2E',
                    500: '#BFA98A',
                },
                ocean: {
                    50: '#F5E6D3',
                    100: '#E7D1B5',
                    200: '#DAB272',
                    300: '#DAA520',
                    400: '#CA8A04',
                    500: '#CA8A04',
                    600: '#B8780A',
                    700: '#8A5F04',
                    800: '#5C3D2E',
                    900: '#2C1A10',
                },
                teal: {
                    400: '#581C87',
                    500: '#3D125F',
                },
                cyan: {
                    300: '#DAA520',
                    400: '#CA8A04',
                    500: '#B8780A',
                },
                blue: {
                    400: '#581C87',
                    500: '#3D125F',
                },
                green: {
                    400: '#22C55E',
                    500: '#15803D',
                },
                emerald: {
                    400: '#22C55E',
                    500: '#15803D',
                },
                orange: {
                    400: '#CA8A04',
                    500: '#B8780A',
                },
                red: {
                    400: '#F87171',
                    500: '#991B1B',
                    600: '#7F1D1D',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-glass': 'linear-gradient(135deg, rgba(202,138,4,0.12) 0%, rgba(44,26,16,0.9) 100%)',
                'gradient-ocean': 'linear-gradient(135deg, #1A0F0A 0%, #2C1A10 48%, #3D2517 100%)',
            },
            boxShadow: {
                quest: '0 2px 8px rgba(202, 138, 4, 0.2)',
                'quest-md': '0 4px 16px rgba(202, 138, 4, 0.25)',
                'quest-lg': '0 8px 32px rgba(202, 138, 4, 0.3)',
                'quest-glow': '0 0 20px rgba(202, 138, 4, 0.4)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'glow': 'glow 3s ease-in-out infinite alternate',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 14px rgba(202, 138, 4, 0.18)' },
                    '100%': { boxShadow: '0 0 22px rgba(202, 138, 4, 0.32)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
