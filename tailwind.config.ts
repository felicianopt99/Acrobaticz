import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    // ========================================================
    // CRÍTICO: Cobertura COMPLETA de todos os diretórios
    // que contêm componentes React com classes Tailwind.
    // Em production (NODE_ENV=production), Tailwind faz
    // aggressive tree-shaking baseado estes patterns.
    // Diretórios faltando aqui = CSS REMOVIDO!
    // ========================================================
    
    // Core application structure
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    
    // 🆕 ADICIONAR: Feature modules e sub-componentes
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/templates/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/blocks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    
    // Utilities and shared
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/constants/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/helpers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist for dynamically generated classes that Tailwind can't detect at build time
  safelist: [
    // Login page dynamic classes
    "rounded-none",
    "border-0",
    "border-b-2",
    "bg-transparent",
    "px-0",
    "px-3",
    "px-4",
    "pr-10",
    "rounded-full",
    "rounded-lg",
    "rounded-md",
    "shadow-sm",
    "shadow-md",
    "shadow-lg",
    "shadow-xl",
    "mr-auto",
    "ml-auto",
    "mx-auto",
    "hover:scale-[1.02]",
    "hover:opacity-90",
    "transition-all",
    "duration-200",
    "duration-300",
    "ease-out",
    // Dynamic sizing
    "w-full",
    "max-w-md",
    "h-8",
    "w-8",
    "h-5",
    "w-5",
    "h-4",
    "w-4",
    // Utility classes
    "bg-card",
    "text-card-foreground",
    "text-foreground",
    "text-muted-foreground",
    "border",
    "transition-colors",
    "absolute",
    "relative",
    "z-10",
    "z-20",
    "z-5",
    "inset-0",
    "top-4",
    "right-4",
    "right-2",
    "top-1/2",
    "-translate-y-1/2",
    "mb-4",
    "mb-2",
    "mb-1",
    "mb-6",
    "mt-6",
    "space-y-4",
    "gap-4",
    "items-center",
    "justify-center",
    "items-end",
    "text-center",
    "text-lg",
    "text-2xl",
    "text-sm",
    "font-bold",
    "font-semibold",
    "min-h-screen",
    "flex",
    "px-4",
    "overflow-hidden",
    "animate-spin",
    "focus:outline-none",
    "hover:text-foreground",
  ],
  theme: {
  	screens: {
  		'xs': '475px',
  		'sm': '640px',
  		'md': '768px',  
  		'lg': '1024px',
  		'xl': '1280px',
  		'2xl': '1536px',
  		// Mobile-specific breakpoints
  		'mobile': { 'max': '767px' },
  		'tablet': { 'min': '768px', 'max': '1023px' },
  		'desktop': { 'min': '1024px' },
  	},
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
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
  			}
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
  			'collapsible-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-collapsible-content-height)'
  				}
  			},
  			'collapsible-up': {
  				from: {
  					height: 'var(--radix-collapsible-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'collapsible-down': 'collapsible-down 0.2s ease-out',
  			'collapsible-up': 'collapsible-up 0.2s ease-out'
  		},
  		// Mobile-optimized spacing and sizing
  		spacing: {
  			'safe-top': 'env(safe-area-inset-top)',
  			'safe-bottom': 'env(safe-area-inset-bottom)',
  			'safe-left': 'env(safe-area-inset-left)',
  			'safe-right': 'env(safe-area-inset-right)',
  		},
  		minHeight: {
  			'screen-safe': '100dvh',
  			'screen-mobile': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  		},
  		height: {
  			'screen-safe': '100dvh',
  			'screen-mobile': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
