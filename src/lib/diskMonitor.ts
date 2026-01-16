import { checkDiskHealth, DiskHealth } from './storage';
import { prisma } from './db';
import { configService } from './config-service';

interface DiskAlertConfig {
  lowSpacePercent: number; // Alert when disk usage exceeds this percent
  checkIntervalMs: number; // How often to check disk health
  adminRoleFilter: string[]; // Which roles get notified
}

const DEFAULT_CONFIG: DiskAlertConfig = {
  lowSpacePercent: 90, // Alert when 90% full
  checkIntervalMs: 300000, // 5 minutes - will be overridden by config
  adminRoleFilter: ['Admin', 'Manager'],
};

let monitoringActive = false;
let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Start the disk health monitoring service
 */
export function startDiskMonitoring(config: Partial<DiskAlertConfig> = {}): void {
  if (monitoringActive) {
    console.log('⚠️ Disk monitoring already active');
    return;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('📊 Starting disk health monitoring...');
  monitoringActive = true;

  // Run initial check
  performHealthCheck(finalConfig);

  // Schedule periodic checks
  monitorInterval = setInterval(() => {
    performHealthCheck(finalConfig);
  }, finalConfig.checkIntervalMs);

  console.log(`✅ Disk monitoring started (interval: ${finalConfig.checkIntervalMs}ms)`);
}

/**
 * Stop the disk health monitoring service
 */
export function stopDiskMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  monitoringActive = false;
  console.log('🛑 Disk monitoring stopped');
}

/**
 * Perform a health check and send alerts if needed
 */
async function performHealthCheck(config: DiskAlertConfig): Promise<void> {
  try {
    const health = await checkDiskHealth();

    if (!health.isAccessible) {
      console.error('🚨 DISK ALERT: External storage is not accessible!', health.error);
      await notifyAdmins(
        'Disk Error',
        `External storage is not accessible: ${health.error}`,
        'critical',
        config.adminRoleFilter
      );
      return;
    }

    const usedPercent = health.usedPercent;
    const availableGB = health.available / (1024 * 1024 * 1024);
    const totalGB = health.total / (1024 * 1024 * 1024);

    // Check if disk is running low
    if (usedPercent >= config.lowSpacePercent) {
      const message = `Disk space is running low: ${usedPercent.toFixed(2)}% full (${availableGB.toFixed(2)}GB / ${totalGB.toFixed(2)}GB available)`;
      console.warn('⚠️ DISK ALERT:', message);
      
      await notifyAdmins(
        'Low Disk Space',
        message,
        usedPercent >= 95 ? 'critical' : 'warning',
        config.adminRoleFilter
      );
    } else {
      console.log(
        `✅ Disk health OK: ${usedPercent.toFixed(2)}% full (${availableGB.toFixed(2)}GB free)`
      );
    }
  } catch (error) {
    console.error('Error during disk health check:', error);
  }
}

/**
 * Send notification to admin users about disk status
 */
async function notifyAdmins(
  title: string,
  message: string,
  priority: 'warning' | 'critical' = 'warning',
  adminRoles: string[]
): Promise<void> {
  try {
    // Get admin users
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: adminRoles,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (admins.length === 0) {
      console.log('No admin users found to notify');
      return;
    }

    // Create notification for each admin
    const notifications = admins.map((admin) => ({
      id: crypto.randomUUID(),
      userId: admin.id,
      type: 'disk-alert',
      title,
      message,
      priority: priority === 'critical' ? 'high' : 'medium',
      isRead: false,
      entityType: 'storage',
      actionUrl: '/admin/storage',
      updatedAt: new Date(),
    }));

    // Bulk insert notifications
    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(`📧 Sent ${admins.length} disk alert notification(s)`);
  } catch (error) {
    console.error('Failed to notify admins about disk status:', error);
  }
}

/**
 * Get current disk health status
 */
export async function getDiskHealthStatus(): Promise<DiskHealth> {
  return await checkDiskHealth();
}

/**
 * Check if monitoring is active
 */
export function isMonitoringActive(): boolean {
  return monitoringActive;
}

/**
 * Get formatted disk health report
 */
export async function getDiskHealthReport(): Promise<string> {
  const health = await checkDiskHealth();

  if (!health.isAccessible) {
    return `❌ DISK ERROR: ${health.error}`;
  }

  const totalGB = health.total / (1024 * 1024 * 1024);
  const usedGB = (health.total - health.available) / (1024 * 1024 * 1024);
  const availableGB = health.available / (1024 * 1024 * 1024);

  return `
📊 Disk Health Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Status: Accessible
Total Size: ${totalGB.toFixed(2)} GB
Used: ${usedGB.toFixed(2)} GB (${health.usedPercent.toFixed(2)}%)
Available: ${availableGB.toFixed(2)} GB
Last Check: ${health.lastCheck.toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}
