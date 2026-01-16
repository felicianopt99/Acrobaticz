import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || "dev-key-change-in-prod";

// Environment variable fallbacks for critical config
const ENV_FALLBACKS: Record<string, Record<string, string | undefined>> = {
  Auth: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  },
  General: {
    DOMAIN: process.env.NEXT_PUBLIC_SITE_URL,
    COMPANY_NAME: process.env.COMPANY_NAME || 'AV Rentals',
    INSTALLATION_COMPLETE: process.env.INSTALLATION_COMPLETE,
  },
  Storage: {
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_BUCKET: process.env.S3_BUCKET,
  },
};

interface CachedConfig {
  [category: string]: Record<string, string | null>;
}

class ConfigService {
  private static instance: ConfigService;
  private prisma = new PrismaClient();
  private cache: CachedConfig = {};
  private cacheExpiry = 5 * 60 * 1000; // 5 min
  private lastCacheTime = 0;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      crypto.scryptSync(ENCRYPTION_KEY, "salt", 32),
      iv
    );
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  private decrypt(encrypted: string): string {
    try {
      // Validate encrypted format (iv:encData)
      if (!encrypted || !encrypted.includes(":")) {
        console.warn("[ConfigService] Invalid encrypted format, returning as-is");
        return encrypted || "";
      }

      const [iv, encData] = encrypted.split(":");
      
      // Validate IV length (should be 32 hex chars = 16 bytes)
      if (!iv || iv.length !== 32 || !encData) {
        console.warn("[ConfigService] Invalid IV or encrypted data, returning as-is");
        return encrypted;
      }

      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        crypto.scryptSync(ENCRYPTION_KEY, "salt", 32),
        Buffer.from(iv, "hex")
      );
      let decrypted = decipher.update(encData, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.warn("[ConfigService] Decryption failed, returning original value:", error);
      return encrypted || "";
    }
  }

  async loadConfig(forceRefresh = false): Promise<CachedConfig> {
    // Check cache validity
    if (
      !forceRefresh &&
      Object.keys(this.cache).length > 0 &&
      Date.now() - this.lastCacheTime < this.cacheExpiry
    ) {
      return this.cache;
    }

    try {
      const settings = await this.prisma.systemSetting.findMany();
      const config: CachedConfig = {};

      settings.forEach((setting) => {
        if (!config[setting.category]) {
          config[setting.category] = {};
        }

        let value = setting.value;
        if (setting.isEncrypted && setting.encryptedValue) {
          value = this.decrypt(setting.encryptedValue);
        }

        config[setting.category][setting.key] = value;
      });

      this.cache = config;
      this.lastCacheTime = Date.now();
      return this.cache;
    } catch (error) {
      console.warn("[ConfigService] Database unavailable, using env fallbacks:", error);
      // Return empty cache - get() will use ENV_FALLBACKS
      return {};
    }
  }

  async get(
    category: string,
    key: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    try {
      const config = await this.loadConfig();
      const dbValue = config[category]?.[key];
      if (dbValue) return dbValue;
    } catch (error) {
      console.warn(`[ConfigService] Error loading config for ${category}.${key}:`, error);
    }
    
    // Fallback to environment variables
    const envValue = ENV_FALLBACKS[category]?.[key];
    if (envValue) return envValue;
    
    return defaultValue;
  }

  async getCategory(category: string): Promise<Record<string, string | null>> {
    const config = await this.loadConfig();
    return config[category] || {};
  }

  async set(
    category: string,
    key: string,
    value: string,
    encrypt = false
  ): Promise<void> {
    const encryptedValue = encrypt ? this.encrypt(value) : null;

    await this.prisma.systemSetting.upsert({
      where: { category_key: { category, key } },
      create: {
        id: crypto.randomUUID(),
        category,
        key,
        value: encrypt ? null : value,
        encryptedValue,
        isEncrypted: encrypt,
        updatedAt: new Date(),
      },
      update: {
        value: encrypt ? null : value,
        encryptedValue,
        isEncrypted: encrypt,
        updatedAt: new Date(),
      },
    });

    await this.loadConfig(true); // Refresh cache
  }

  async isInstalled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findFirst({
        where: { key: "INSTALLATION_COMPLETE" },
      });
      if (setting?.value === "true") return true;
    } catch (error) {
      console.warn("[ConfigService] Error checking installation status:", error);
    }
    
    // Fallback to environment variable
    return process.env.INSTALLATION_COMPLETE === "true";
  }
}

export const configService = ConfigService.getInstance();
