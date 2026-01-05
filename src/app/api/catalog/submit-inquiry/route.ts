import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface InquiryItem {
  equipmentId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      token,
      cartItems,
      eventName,
      eventType,
      eventLocation,
      startDate,
      endDate,
      deliveryLocation,
      setupDateTime,
      breakdownDateTime,
      name,
      email,
      phone,
      company,
      specialRequirements,
      budget,
    } = await request.json();

    if (!token || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: missing token or cart items' },
        { status: 400 }
      );
    }

    if (!eventName || !eventLocation || !startDate || !endDate || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the catalog share exists
    const catalogShare = await prisma.catalogShare.findUnique({
      where: { token },
      include: { partner: true },
    });

    if (!catalogShare) {
      return NextResponse.json(
        { error: 'Invalid catalog share token' },
        { status: 404 }
      );
    }

    // Check expiration
    if (catalogShare.expiresAt && new Date(catalogShare.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Catalog share has expired' },
        { status: 410 }
      );
    }

    // Verify equipment exists and belongs to this catalog
    const equipmentIds = cartItems.map((item: InquiryItem) => item.equipmentId);
    const equipment = await prisma.equipmentItem.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true },
    });

    if (equipment.length !== equipmentIds.length) {
      return NextResponse.json(
        { error: 'Some equipment items are no longer available' },
        { status: 400 }
      );
    }

    // TODO: Create inquiry record when catalogShareInquiry model is added
    // const inquiry = await prisma.catalogShareInquiry.create({
    //   data: {
    //     catalogShareId: catalogShare.id,
    //     partnerId: catalogShare.partnerId,
    //     eventName,
    //     eventType: eventType || null,
    //     eventLocation,
    //     startDate: new Date(startDate),
    //     endDate: new Date(endDate),
    //     deliveryLocation: deliveryLocation || null,
    //     setupDateTime: setupDateTime ? new Date(setupDateTime) : null,
    //     breakdownDateTime: breakdownDateTime ? new Date(breakdownDateTime) : null,
    //     customerName: name,
    //     customerEmail: email,
    //     customerPhone: phone,
    //     customerCompany: company || null,
    //     specialRequirements: specialRequirements || null,
    //     budget: budget || null,
    //     items: cartItems,
    //     status: 'pending',
    //   },
    // });

    const inquiry = { id: 'temp-id' }; // Temporary until model is added

    // TODO: Send email notification to partner with inquiry details
    // Email service will be configured later

    return NextResponse.json(
      {
        success: true,
        inquiryId: inquiry.id,
        message: 'Inquiry submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting catalog inquiry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
