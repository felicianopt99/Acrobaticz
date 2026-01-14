'use client'

import { Zap, Package, Trophy, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 py-16 sm:py-24 lg:py-32',
        className
      )}
    >
      {/* Abstract Gradient Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/30">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">Premium Equipment Rental</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Professional Equipment
            <span className="block bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
              At Your Service
            </span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Access premium quality equipment for your projects. From construction to events, we have everything you need with competitive rates and reliable service.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-neutral-800/50">
          {[
            {
              icon: Package,
              title: 'Premium Quality',
              description: 'Professionally maintained equipment',
            },
            {
              icon: Truck,
              title: 'Fast Delivery',
              description: 'Quick and reliable delivery service',
            },
            {
              icon: Trophy,
              title: 'Best Prices',
              description: 'Competitive rates guaranteed',
            },
            {
              icon: Zap,
              title: 'Expert Support',
              description: '24/7 customer support available',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/30 to-neutral-900/30 border border-neutral-700/30 hover:border-blue-500/30 transition-all duration-300 hover:bg-gradient-to-br hover:from-neutral-800/50 hover:to-neutral-900/50"
            >
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 w-fit mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-neutral-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
