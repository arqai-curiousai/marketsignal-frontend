/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            fontFamily: {
                display: ['var(--font-display)', 'system-ui', 'sans-serif'],
                serif: ['var(--font-serif)', 'Georgia', 'serif'],
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                },
                // MarketSignal brand colors — emerald primary with true spectral depth
                brand: {
                    slate: '#091412',      // Deepened dark bg
                    emerald: '#6EE7B7',    // Primary accent (unchanged)
                    blue: '#60A5FA',       // True blue-400 (secondary)
                    violet: '#A78BFA',     // True violet-400 (tertiary)
                    amber: '#FBBF24',      // Warm emphasis / alerts
                    sage: '#86EFAC',       // Light sage (highlights)
                    moss: '#166534',       // Deep moss (dark accents)
                }
            },
            zIndex: {
                'overlay': '5',
                'dropdown': '10',
                'sticky': '20',
                'modal': '30',
                'toast': '40',
                'popover': '50',
                'skip': '100',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px var(--glow-color, rgba(52,211,153,0.3))' },
                    '50%': { boxShadow: '0 0 40px var(--glow-color, rgba(52,211,153,0.5))' },
                },
                'float-up': {
                    '0%': { transform: 'translateY(0)', opacity: '0.6' },
                    '50%': { opacity: '1' },
                    '100%': { transform: 'translateY(-400px)', opacity: '0' },
                },
                'data-stream': {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-100%)' },
                },
                'spin-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'dash-flow': {
                    '0%': { strokeDashoffset: '20' },
                    '100%': { strokeDashoffset: '0' },
                },
                'bias-cycle': {
                    '0%, 100%': { transform: 'translateX(0%)' },
                    '33%': { transform: 'translateX(-100%)' },
                    '66%': { transform: 'translateX(100%)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'float': 'float 5s ease-in-out infinite',
                'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                'float-up': 'float-up 4s ease-in-out infinite',
                'data-stream': 'data-stream 20s linear infinite',
                'spin-slow': 'spin-slow 8s linear infinite',
                'dash-flow': 'dash-flow 1.5s linear infinite',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
