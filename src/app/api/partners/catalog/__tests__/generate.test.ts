import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../generate/route';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    equipmentItem: {
      findMany: vi.fn(),
    },
  },
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    setFont: vi.fn(),
    setDrawColor: vi.fn(),
    line: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue(['line1', 'line2']),
    addPage: vi.fn(),
    output: vi.fn().mockReturnValue(new ArrayBuffer(100)),
  })),
}));

import { prisma } from '@/lib/db';

describe('POST /api/partners/catalog/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if no equipment IDs are provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/partners/catalog/generate', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'test-partner',
        partnerName: 'Test Partner',
        equipmentIds: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No equipment selected');
  });

  it('should return 404 if no equipment is found', async () => {
    vi.mocked(prisma.equipmentItem.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/partners/catalog/generate', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'test-partner',
        partnerName: 'Test Partner',
        equipmentIds: ['eq-1', 'eq-2'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('No equipment found');
  });

  it('should generate PDF with valid equipment', async () => {
    const mockEquipment = [
      {
        id: 'eq-1',
        name: 'Sony FX6',
        description: '4K Cinema Camera',
        dailyRate: 500,
        quantity: 2,
        status: 'good',
        category: { id: 'cat-1', name: 'Cameras' },
      },
      {
        id: 'eq-2',
        name: 'Sony A6700',
        description: '4K Mirrorless Camera',
        dailyRate: 300,
        quantity: 3,
        status: 'good',
        category: { id: 'cat-1', name: 'Cameras' },
      },
    ];

    vi.mocked(prisma.equipmentItem.findMany).mockResolvedValueOnce(mockEquipment);

    const request = new NextRequest('http://localhost:3000/api/partners/catalog/generate', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'test-partner',
        partnerName: 'Stereolites',
        equipmentIds: ['eq-1', 'eq-2'],
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('Stereolites');
  });

  it('should fetch only equipment with good status', async () => {
    const request = new NextRequest('http://localhost:3000/api/partners/catalog/generate', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'test-partner',
        partnerName: 'Test Partner',
        equipmentIds: ['eq-1'],
      }),
    });

    await POST(request);

    expect(prisma.equipmentItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'good',
        }),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(prisma.equipmentItem.findMany).mockRejectedValueOnce(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/partners/catalog/generate', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'test-partner',
        partnerName: 'Test Partner',
        equipmentIds: ['eq-1'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to generate catalog');
  });
});
