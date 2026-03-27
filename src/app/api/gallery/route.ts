import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function getUserId(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const contentType = searchParams.get('contentType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const where: any = { isActive: true }
    if (category && category !== 'all') where.category = category
    if (contentType) where.contentType = contentType
    const premiumParam = searchParams.get('premium')
    if (premiumParam === 'true') where.isPremium = true
    else where.isPremium = false

    const allItems = await db.gallery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        thumbnailUrl: true,
        category: true,
        contentType: true,
        isPremium: true,
        allowedPlans: true,
        displayOrder: true,
        views: true,
        likes: true,
        createdAt: true
      }
    })

    // Hierarchy-based plan filtering
    // Plans sorted by price (asc) = tier order: Basic < Premium < VIP
    // A user can see content assigned to their plan AND all lower-tier plans
    const planId = searchParams.get('planId')
    let accessiblePlanIds: string[] = []
    if (planId) {
      const allPlans = await db.plan.findMany({ select: { id: true, price: true }, orderBy: { price: 'asc' } })
      const userPlanIndex = allPlans.findIndex(p => p.id === planId)
      // user can access their tier and everything below
      accessiblePlanIds = userPlanIndex >= 0 ? allPlans.slice(0, userPlanIndex + 1).map(p => p.id) : [planId]
    }

    const items = allItems.filter(item => {
      if (!item.allowedPlans) return true // no restriction = everyone sees it
      try {
        const allowed: string[] = JSON.parse(item.allowedPlans)
        if (allowed.length === 0) return true
        if (!planId) return false // premium content, no plan = deny
        // allow if any of user's accessible plans is in the allowed list
        return accessiblePlanIds.some(id => allowed.includes(id))
      } catch {
        return true
      }
    })
    const total = items.length

    const userId = getUserId(request)
    let likedSet = new Set<string>()
    if (userId && items.length > 0) {
      const ids = items.map(i => i.id)
      const likedRows = await (db as any).galleryLike.findMany({
        where: { galleryId: { in: ids }, userId },
        select: { galleryId: true }
      })
      likedSet = new Set(likedRows.map((r: any) => r.galleryId))
    }

    const data = items.map(item => {
      const isBase64Video = item.contentType === 'video' && item.imageUrl?.startsWith('data:')

      return {
        ...item,
        // base64 video (old) -> stream URL, disk video -> use as-is
        imageUrl: isBase64Video ? `/api/gallery/stream/${item.id}` : item.imageUrl,
        thumbnailUrl: item.thumbnailUrl || null,
        liked: likedSet.has(item.id)
      }
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
