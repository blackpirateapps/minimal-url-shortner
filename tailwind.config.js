/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Midnight Ocean palette
                dark: {
                    900: '#0a1628',
                    800: '#0d1d35',
                    700: '#0f2442',
                    600: '#142c4f',
                    500: '#1e3a5f',
                },
                // Ocean accent colors
                ocean: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                },
                // Secondary teal
                teal: {
                    400: '#2dd4bf',
                    500: '#14b8a6',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                'gradient-ocean': 'linear-gradient(135deg, #0a1628 0%, #0f172a 50%, #0c1e38 100%)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'glow': 'glow 3s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' },
                    '100%': { boxShadow: '0 0 35px rgba(34, 211, 238, 0.3)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
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
