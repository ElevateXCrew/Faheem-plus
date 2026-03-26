import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const plans: any[] = await db.$queryRaw`SELECT * FROM Plan WHERE isActive = true ORDER BY price ASC`
    return NextResponse.json({
      success: true,
      plans: plans.map(plan => {
        let discountedPrice: number | null = null
        if (plan.discountPercent) {
          discountedPrice = parseFloat((plan.price * (1 - plan.discountPercent / 100)).toFixed(2))
        } else if (plan.discountAmount) {
          discountedPrice = parseFloat(parseFloat(plan.discountAmount).toFixed(2))
        }
        return {
          ...plan,
          features: (() => { try { return JSON.parse(plan.features) } catch { return [] } })(),
          discountedPrice,
        }
      })
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
