import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { configService } from '@/lib/config-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Installation Wizard E2E', () => {
  beforeAll(async () => {
    // Clean up any existing settings
    await prisma.systemSetting.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('ConfigService', () => {
    it('should store and retrieve configuration', async () => {
      await configService.set('General', 'DOMAIN', 'example.com', false);
      const domain = await configService.get('General', 'DOMAIN');
      expect(domain).toBe('example.com');
    });

    it('should encrypt sensitive values', async () => {
      const secret = 'my-secret-jwt-key';
      await configService.set('Auth', 'JWT_SECRET', secret, true);
      
      const retrieved = await configService.get('Auth', 'JWT_SECRET');
      expect(retrieved).toBe(secret);

      // Verify it's actually encrypted in the database
      const setting = await prisma.systemSetting.findUnique({
        where: { category_key: { category: 'Auth', key: 'JWT_SECRET' } },
      });
      expect(setting?.isEncrypted).toBe(true);
      expect(setting?.encryptedValue).not.toContain(secret);
    });

    it('should cache configuration for 5 minutes', async () => {
      await configService.set('General', 'TEST_KEY', 'test-value', false);
      const config1 = await configService.loadConfig();
      
      // Update directly in DB to test cache behavior
      await prisma.systemSetting.update({
        where: { category_key: { category: 'General', key: 'TEST_KEY' } },
        data: { value: 'updated-value' },
      });

      // Should still return cached value
      const config2 = await configService.loadConfig();
      expect(config2.General.TEST_KEY).toBe('test-value');

      // Force refresh should get new value
      const config3 = await configService.loadConfig(true);
      expect(config3.General.TEST_KEY).toBe('updated-value');
    });

    it('should get category config', async () => {
      await configService.set('General', 'COMPANY_NAME', 'AV Rentals', false);
      await configService.set('General', 'DOMAIN', 'example.com', false);

      const generalConfig = await configService.getCategory('General');
      expect(generalConfig.COMPANY_NAME).toBe('AV Rentals');
      expect(generalConfig.DOMAIN).toBe('example.com');
    });

    it('should check installation status', async () => {
      // Not installed initially
      let isInstalled = await configService.isInstalled();
      expect(isInstalled).toBe(false);

      // Mark as installed
      await configService.set('General', 'INSTALLATION_COMPLETE', 'true', false);
      isInstalled = await configService.isInstalled();
      expect(isInstalled).toBe(true);
    });
  });

  describe('Installation Flow', () => {
    it('should complete installation with all required settings', async () => {
      // Clear previous data
      await prisma.systemSetting.deleteMany({});

      const installationData = {
        domain: 'test.example.com',
        companyName: 'Test Company',
        jwtSecret: 'test-jwt-secret-key',
        deeplApiKey: 'test-deepl-key',
        companyLogo: 'https://example.com/logo.png',
      };

      // Simulate installation
      await configService.set('General', 'DOMAIN', installationData.domain, false);
      await configService.set('General', 'COMPANY_NAME', installationData.companyName, false);
      await configService.set('Auth', 'JWT_SECRET', installationData.jwtSecret, true);
      await configService.set('DeepL', 'DEEPL_API_KEY', installationData.deeplApiKey, true);
      await configService.set('Branding', 'LOGO_URL', installationData.companyLogo, false);
      await configService.set('General', 'INSTALLATION_COMPLETE', 'true', false);

      // Verify all settings
      const domain = await configService.get('General', 'DOMAIN');
      const company = await configService.get('General', 'COMPANY_NAME');
      const jwtSecret = await configService.get('Auth', 'JWT_SECRET');
      const deeplKey = await configService.get('DeepL', 'DEEPL_API_KEY');
      const logo = await configService.get('Branding', 'LOGO_URL');
      const installed = await configService.isInstalled();

      expect(domain).toBe(installationData.domain);
      expect(company).toBe(installationData.companyName);
      expect(jwtSecret).toBe(installationData.jwtSecret);
      expect(deeplKey).toBe(installationData.deeplApiKey);
      expect(logo).toBe(installationData.companyLogo);
      expect(installed).toBe(true);
    });

    it('should support optional configuration fields', async () => {
      // DeepL API key is optional
      await configService.set('General', 'DOMAIN', 'example2.com', false);
      
      const deeplKey = await configService.get('DeepL', 'DEEPL_API_KEY');
      expect(deeplKey).toBeUndefined();

      // Should not fail
      const domain = await configService.get('General', 'DOMAIN');
      expect(domain).toBe('example2.com');
    });
  });

  // NOTE: License Management tests commented - PurchaseLicense model does not exist in schema
  // describe('License Management', () => {
  //   it('should create and validate purchase license', async () => {
  //     const purchaseCode = 'ABCD1234EFGH5678IJKL';
  //     
  //     const license = await prisma.purchaseLicense.create({
  //       data: {
  //         purchaseCode,
  //         instanceHash: 'test-hash-123',
  //         isActive: true,
  //       },
  //     });

  //     expect(license.purchaseCode).toBe(purchaseCode);
  //     expect(license.isActive).toBe(true);

  //     // Retrieve it
  //     const retrieved = await prisma.purchaseLicense.findUnique({
  //       where: { purchaseCode },
  //     });
  //     expect(retrieved).toBeDefined();
  //     expect(retrieved?.isActive).toBe(true);
  //   });

  //   it('should track multiple installations per license', async () => {
  //     const purchaseCode = 'MULTI1234INSTALL5678';
  //     
  //     // First installation
  //     const license1 = await prisma.purchaseLicense.create({
  //       data: {
  //         purchaseCode,
  //         instanceHash: 'hash-server-1',
  //         isActive: true,
  //       },
  //     });

  //     // Second installation
  //     const license2 = await prisma.purchaseLicense.create({
  //       data: {
  //         purchaseCode,
  //         instanceHash: 'hash-server-2',
  //         isActive: true,
  //       },
  //     });

  //     // Verify both exist
  //     const licenses = await prisma.purchaseLicense.findMany({
  //       where: { purchaseCode },
  //     });
  //     expect(licenses).toHaveLength(2);
  //   });
  // });
});
