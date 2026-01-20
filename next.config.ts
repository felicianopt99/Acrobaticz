import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // ============================================================
  // BUILD PERFORMANCE OPTIMIZATIONS
  // Target: 70-90s → 40-50s (40% reduction)
  // ============================================================
  
  // Parallelize builds with worker threads
  experimental: {
    // Tree-shake unused code aggressively
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'date-fns',
      'lucide-react',
      '@fullcalendar/react',
      '@tanstack/react-query',
      'recharts',
    ],
    // Enable optimized TypeScript stripping
    optimizeCss: true,
  },
  
  images: {
    unoptimized: process.env.NODE_ENV === 'production' ? false : true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Optimize emotion/styled-components
    styledComponents: true,
  },
  
  // ============================================================
  // RUNTIME PERFORMANCE OPTIMIZATIONS
  // ============================================================
  
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Turbopack configuration for Next.js 16+
  turbopack: {},
  
  // Webpack optimizations (fallback)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        // Enable code splitting for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // React + Next.js internals
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Radix UI (UI components library)
            radix: {
              name: 'radix',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@radix-ui/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Date/Calendar libraries
            calendar: {
              name: 'calendar',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@fullcalendar|date-fns)/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // Common large libraries
            common: {
              name: 'common',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
