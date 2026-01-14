'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LayoutDashboard, Cloud, ChevronRight, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomizationSettings } from '@/hooks/useCustomizationSettings';
import { APP_NAME } from '@/lib/constants';

export default function AppSelectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedApp, setSelectedApp] = useState<'dashboard' | 'cloud' | null>(null);
  const { data: settings } = useCustomizationSettings();

  const displayName = settings?.companyName || APP_NAME;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleNavigation = async (choice: 'dashboard' | 'cloud') => {
    setLoading(true);
    setSelectedApp(choice);

    const destination = choice === 'dashboard' ? '/dashboard' : '/drive';
    
    // Use router.push for smoother navigation
    router.push(destination);
    
    // Refresh to ensure server components and auth are synced
    setTimeout(() => {
      router.refresh();
    }, 100);
  };

  if (!isAuthenticated) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const cardVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo and Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {settings?.logoUrl && settings?.useTextLogo === false ? (
              <img 
                src={settings.logoUrl} 
                alt={displayName}
                className="h-16 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <h1 
                  className="text-3xl md:text-4xl font-bold text-white"
                  style={{ color: settings?.primaryColor || undefined }}
                >
                  {displayName}
                </h1>
              </>
            )}
          </div>
          <p className="text-lg text-gray-400">
            Choose how you want to access the platform
          </p>
        </motion.div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Dashboard Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <button
              onClick={() => handleNavigation('dashboard')}
              disabled={loading}
              className="w-full h-full"
            >
              <div className={`glass-card rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer border ${
                selectedApp === 'dashboard' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/10 hover:border-primary/50 hover:bg-white/5'
              }`}>
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 mb-6 shadow-lg shadow-primary/20">
                  <LayoutDashboard className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                  Access inventory, rentals, events, quotes, and manage your business operations
                </p>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span>Enter Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </motion.div>

          {/* Cloud Storage Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <button
              onClick={() => handleNavigation('cloud')}
              disabled={loading}
              className="w-full h-full"
            >
              <div className={`glass-card rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer border ${
                selectedApp === 'cloud' 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
              }`}>
                <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-5 mb-6 shadow-lg shadow-purple-500/20">
                  <Cloud className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Cloud Storage</h2>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                  Manage files and documents with advanced organization, sharing, and storage features
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <span>Open Cloud</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 border-4 border-gray-700 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-gray-300 font-medium">
                {selectedApp === 'dashboard' ? 'Opening Dashboard...' : 'Opening Cloud Storage...'}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
