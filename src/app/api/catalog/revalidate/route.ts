import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  // Validar secret
  const secret = request.headers.get('x-revalidate-secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { token, type } = await request.json()

  try {
    if (type === 'catalog') {
      // Revalidar página específica do catálogo
      revalidatePath(`/catalog/${token}`)
    } else if (type === 'all') {
      // Revalidar todas as páginas de catálogo
      revalidatePath('/catalog', 'layout')
    } else if (type === 'equipment') {
      // Revalidar catálogos que incluem este equipamento
      revalidatePath('/api/equipment')
      
      // Revalidar catálogos associados
      if (process.env.NODE_ENV === 'production') {
        // Em produção, buscar e revalidar cada catálogo manualmente
        const catalogs = await prisma.catalogShare.findMany()
        for (const catalog of catalogs) {
          revalidatePath(`/catalog/${catalog.token}`)
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Cache revalidated' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    )
  }
}
