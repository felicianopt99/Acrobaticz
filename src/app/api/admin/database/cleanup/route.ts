/**
 * API endpoint for database maintenance and cleanup
 * Requires admin authentication
 * 
 * POST /api/admin/database/cleanup - Run cleanup
 * GET /api/admin/database/cleanup-stats - Get cleanup statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { DatabaseCleanup } from '@/lib/database-cleanup'
import { requirePermission } from '@/lib/api-auth'

/**
 * GET /api/admin/database/cleanup-stats
 * Get cleanup statistics without running cleanup
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin permission (canManageEquipment)
    const authResult = requirePermission(request, 'canManageEquipment')
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const stats = await DatabaseCleanup.getCleanupStats()

    return NextResponse.json({
      success: true,
      stats,
      message: 'Cleanup statistics retrieved successfully',
    })
  } catch (error) {
    console.error('[Cleanup API] Error getting stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cleanup statistics',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/database/cleanup
 * Run full cleanup with optional parameters
 * 
 * Body:
 * {
 *   "activityLogRetention": 90,     // days to keep activity logs
 *   "trashedFileRetention": 30,     // days to keep trashed files before permanent deletion
 *   "trashedFolderRetention": 30,   // days to keep trashed folders before permanent deletion
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin permission (canManageEquipment)
    const authResult = requirePermission(request, 'canManageEquipment')
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const {
      activityLogRetention = 90,
      trashedFileRetention = 30,
      trashedFolderRetention = 30,
      dryRun = false, // If true, only get stats without deleting
    } = body

    // If dry run, just get stats
    if (dryRun) {
      const stats = await DatabaseCleanup.getCleanupStats()
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: 'Dry run completed. No data was deleted.',
        stats,
      })
    }

    // Run full cleanup
    const result = await DatabaseCleanup.runFullCleanup({
      activityLogRetention,
      trashedFileRetention,
      trashedFolderRetention,
    })

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully',
      result,
    })
  } catch (error) {
    console.error('[Cleanup API] Error running cleanup:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run database cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
