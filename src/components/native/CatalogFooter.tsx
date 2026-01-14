'use client'

import { Mail, Phone, MapPin, Linkedin, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface CatalogFooterProps {
  className?: string
}

export function CatalogFooter({ className }: CatalogFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn('bg-gradient-to-b from-neutral-900/50 to-neutral-950 border-t border-neutral-800/50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg" />
              <h3 className="text-lg font-bold text-white">Equipment Rental</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Premium equipment rental services for professionals and businesses.
              Quality, reliability, and excellence in every rental.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin].map((Icon, i) => (
                <button
                  key={i}
                  className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {['Products', 'Categories', 'About Us', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {['Help Center', 'FAQs', 'Shipping', 'Returns'].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-neutral-800/50 mb-8" />

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Phone,
              title: 'Phone',
              value: '+1 (555) 123-4567',
            },
            {
              icon: Mail,
              title: 'Email',
              value: 'support@rental.com',
            },
            {
              icon: MapPin,
              title: 'Address',
              value: '123 Business St, City, State',
            },
          ].map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {title}
                </p>
                <p className="text-sm text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-neutral-800/50 mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <p>&copy; {currentYear} Equipment Rental. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-neutral-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-neutral-300 transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
