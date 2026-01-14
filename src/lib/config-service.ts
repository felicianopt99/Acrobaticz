import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || "dev-key-change-in-prod";

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
    const [iv, encData] = encrypted.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      crypto.scryptSync(ENCRYPTION_KEY, "salt", 32),
      Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(encData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
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
  }

  async get(
    category: string,
    key: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    const config = await this.loadConfig();
    return config[category]?.[key] || defaultValue;
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
        category,
        key,
        value: encrypt ? null : value,
        encryptedValue,
        isEncrypted: encrypt,
      },
      update: {
        value: encrypt ? null : value,
        encryptedValue,
        isEncrypted: encrypt,
      },
    });

    await this.loadConfig(true); // Refresh cache
  }

  async isInstalled(): Promise<boolean> {
    const setting = await this.prisma.systemSetting.findFirst({
      where: { key: "INSTALLATION_COMPLETE" },
    });
    return setting?.value === "true";
  }
}

export const configService = ConfigService.getInstance();
