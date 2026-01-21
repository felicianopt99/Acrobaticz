import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get existing settings or create defaults
    let settings = await prisma.customization_settings.findFirst();
    
    if (!settings) {
      console.log('Creating default settings...');
      settings = await prisma.customization_settings.create({
        data: {
          id: randomUUID(),
          companyName: 'AV Rentals',
          companyTagline: 'Professional Audio Visual Equipment Rental',
          contactEmail: 'info@avrental.com',
          contactPhone: '+1 (555) 123-4567',
          useTextLogo: true,
          primaryColor: '#3B82F6',
          secondaryColor: '#F3F4F6',
          accentColor: '#10B981',
          darkMode: true,
          // Login Page - MODERN DESIGN
          loginBackgroundType: 'gradient',
          loginBackgroundColor1: '#0F1419',
          loginBackgroundColor2: '#1E293B',
          loginCardOpacity: 0.95,
          loginCardBlur: true,
          loginCardPosition: 'center',
          loginCardWidth: 400,
          loginCardBorderRadius: 12,
          loginCardShadow: 'xl',
          loginLogoSize: 80,
          loginWelcomeMessage: 'Welcome back',
          loginWelcomeSubtitle: 'Sign in to your account',
          loginShowCompanyName: true,
          loginFormSpacing: 16,
          loginButtonStyle: 'rounded',
          loginInputStyle: 'rounded',
          loginAnimations: true,
          systemName: 'AV Rentals Management System',
          timezone: 'Europe/Madrid',
          dateFormat: 'DD/MM/YYYY',
          currency: 'EUR',
          language: 'en',
          sessionTimeout: 24,
          requireStrongPasswords: true,
          enableTwoFactor: false,
          maxLoginAttempts: 5,
          emailEnabled: true,
          smtpPort: '587',
          fromEmail: 'noreply@avrental.com',
          autoBackup: true,
          backupFrequency: 'daily',
          backupRetention: 30,
          logoUrl: '',
          pdfLogoUrl: '',
          updatedAt: new Date(),
        },
      });
    } else {
      console.log('Updating existing settings with modern design...');
      // Update to modern design
      settings = await prisma.customization_settings.update({
        where: { id: settings.id },
        data: {
          // Login Page - MODERN DESIGN
          loginBackgroundType: 'gradient',
          loginBackgroundColor1: '#0F1419',
          loginBackgroundColor2: '#1E293B',
          loginCardOpacity: 0.95,
          loginCardBlur: true,
          loginCardPosition: 'center',
          loginCardWidth: 400,
          loginCardBorderRadius: 12,
          loginCardShadow: 'xl',
          loginLogoSize: 80,
          loginWelcomeMessage: 'Welcome back',
          loginWelcomeSubtitle: 'Sign in to your account',
          loginShowCompanyName: true,
          loginFormSpacing: 16,
          loginButtonStyle: 'rounded',
          loginInputStyle: 'rounded',
          loginAnimations: true,
          darkMode: true,
        },
      });
    }
    
    console.log('✓ Login design updated to MODERN');
    console.log('Current settings:');
    console.log(JSON.stringify({
      loginBackgroundType: settings.loginBackgroundType,
      loginCardBlur: settings.loginCardBlur,
      loginButtonStyle: settings.loginButtonStyle,
      loginInputStyle: settings.loginInputStyle,
      loginAnimations: settings.loginAnimations,
      loginCardBorderRadius: settings.loginCardBorderRadius,
    }, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
