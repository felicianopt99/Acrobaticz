import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireReadAccess } from '@/lib/api-auth'
import { createEvents } from 'ics'

// GET /api/rentals/calendar.ics - Get calendar in ICS format for syncing
export async function GET(request: NextRequest) {

  try {
    // Fetch all events with their associated rentals and client info
    const events = await prisma.event.findMany({
      include: {
        Client: true,
        Rental: {
          include: {
            EquipmentItem: true,
          }
        }
      },
      orderBy: { startDate: 'asc' },
    })

    // Convert events to ICS format
    const icsEvents = events.map(event => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      
      const rentalSummary = event.Rental.length > 0 
        ? `${event.Rental.length} rental${event.Rental.length !== 1 ? 's' : ''}`
        : 'No rentals'

      return {
        title: event.name,
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate()] as [number, number, number],
        end: [end.getFullYear(), end.getMonth() + 1, end.getDate()] as [number, number, number],
        description: `Client: ${event.Client.name}\nLocation: ${event.location || 'Not specified'}\n${rentalSummary}\n\nEvent ID: ${event.id}`,
        location: event.location || undefined,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${event.id}`,
      }
    })

    // Generate ICS content
    const { error, value } = createEvents(icsEvents)

    if (error) {
      console.error('ICS generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate calendar' },
        { status: 500 }
      )
    }

    if (!value) {
      return NextResponse.json(
        { error: 'No calendar data generated' },
        { status: 500 }
      )
    }

    // Return as ICS file
    return new NextResponse(value, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rentals-calendar.ics"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Calendar ICS error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}
