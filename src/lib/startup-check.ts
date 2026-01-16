import { configService } from "./config-service";

export async function startupCheck() {
  try {
    const isInstalled = await configService.isInstalled();

    if (!isInstalled) {
      console.log("⚠️  Installation not complete. Redirecting to /install");
      return { ready: false, redirect: "/install" };
    }

    // Validate critical configs exist (check env vars as fallback)
    const domain = await configService.get("General", "DOMAIN") || process.env.NEXT_PUBLIC_SITE_URL;
    const jwtSecret = await configService.get("Auth", "JWT_SECRET") || process.env.JWT_SECRET;

    if (!domain || !jwtSecret) {
      console.warn("⚠️ Missing some configuration, but JWT_SECRET may be in env");
      // Don't throw error - let the app continue if env vars are set
      if (!process.env.JWT_SECRET) {
        throw new Error("Missing critical configuration: JWT_SECRET");
      }
    }

    console.log("✅ Startup check passed");
    return { ready: true };
  } catch (error) {
    console.error("❌ Startup check failed:", error);
    return { ready: false, redirect: "/install" };
  }
}
