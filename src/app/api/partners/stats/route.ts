import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReadAccess } from '@/lib/api-auth'

// GET /api/partners/stats - Get partner statistics
export async function GET(request: NextRequest) {

  try {
    const [
      totalPartners,
      activePartners,
      totalSubrentals,
      activeSubrentals,
      subrentalStats,
    ] = await Promise.all([
      prisma.partner.count(),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.subrental.count(),
      prisma.subrental.count({ where: { status: 'active' } }),
      prisma.subrental.aggregate({
        _sum: {
          totalCost: true,
        },
        _avg: {
          totalCost: true,
        },
      }),
    ])

    // Get top partners by subrental count
    const topPartners = await prisma.partner.findMany({
      take: 5,
      orderBy: {
        Subrental: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: { Subrental: true }
        }
      }
    })

    // Get monthly subrental totals for current year
    const currentYear = new Date().getFullYear()
    const monthlyStats = await prisma.subrental.groupBy({
      by: ['status'],
      where: {
        startDate: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        }
      },
      _count: true,
      _sum: {
        totalCost: true,
      },
    })

    return NextResponse.json({
      totalPartners,
      activePartners,
      totalSubrentals,
      activeSubrentals,
      totalSpent: subrentalStats._sum.totalCost || 0,
      averageCost: subrentalStats._avg.totalCost || 0,
      topPartners,
      monthlyStats,
    })
  } catch (error) {
    console.error('Error fetching partner stats:', error)
    return NextResponse.json({ error: 'Failed to fetch partner statistics' }, { status: 500 })
  }
}
