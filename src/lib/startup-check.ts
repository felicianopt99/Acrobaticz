import { configService } from "./config-service";

export async function startupCheck() {
  try {
    const isInstalled = await configService.isInstalled();

    if (!isInstalled) {
      console.log("⚠️  Installation not complete. Redirecting to /install");
      return { ready: false, redirect: "/install" };
    }

    // Validate critical configs exist
    const domain = await configService.get("General", "DOMAIN");
    const jwtSecret = await configService.get("Auth", "JWT_SECRET");

    if (!domain || !jwtSecret) {
      throw new Error("Missing critical configuration");
    }

    console.log("✅ Startup check passed");
    return { ready: true };
  } catch (error) {
    console.error("❌ Startup check failed:", error);
    return { ready: false, redirect: "/install" };
  }
}
