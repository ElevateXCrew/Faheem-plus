import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminAuth } from '../helpers'

export async function GET(request: NextRequest) {
  try { await verifyAdminAuth(request) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  try {
    const plans: any[] = await db.$queryRaw`SELECT * FROM Plan ORDER BY price ASC`
    return NextResponse.json({
      success: true,
      plans: plans.map(p => ({ ...p, features: (() => { try { return JSON.parse(p.features) } catch { return [] } })() }))
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try { await verifyAdminAuth(request) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  try {
    const { name, price, currency, duration, features, discountPercent, discountAmount, isActive } = await request.json()
    if (!name || price === undefined || !duration)
      return NextResponse.json({ error: 'name, price, duration required' }, { status: 400 })

    const plan = await db.plan.create({
      data: { name, price: parseFloat(price), currency: currency || 'USD', duration, features: JSON.stringify(Array.isArray(features) ? features : []), isActive: Boolean(isActive !== false) }
    })

    const dp = discountPercent !== '' && discountPercent != null ? parseFloat(discountPercent) : null
    const da = discountAmount !== '' && discountAmount != null ? parseFloat(discountAmount) : null
    await db.$executeRaw`UPDATE Plan SET discountPercent = ${dp}, discountAmount = ${da} WHERE id = ${plan.id}`

    const rows: any[] = await db.$queryRaw`SELECT * FROM Plan WHERE id = ${plan.id}`
    const p = rows[0]
    return NextResponse.json({ success: true, plan: { ...p, features: (() => { try { return JSON.parse(p.features) } catch { return [] } })() } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Create failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try { await verifyAdminAuth(request) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const { name, price, currency, duration, features, discountPercent, discountAmount, isActive } = await request.json()

    const data: any = {}
    if (name !== undefined) data.name = name
    if (price !== undefined) data.price = parseFloat(price)
    if (currency !== undefined) data.currency = currency
    if (duration !== undefined) data.duration = duration
    if (features !== undefined) data.features = JSON.stringify(Array.isArray(features) ? features : [])
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (Object.keys(data).length > 0) await db.plan.update({ where: { id }, data })

    if (discountPercent !== undefined || discountAmount !== undefined) {
      const dp = discountPercent === '' || discountPercent == null ? null : parseFloat(discountPercent)
      const da = discountAmount === '' || discountAmount == null ? null : parseFloat(discountAmount)
      await db.$executeRaw`UPDATE Plan SET discountPercent = ${dp}, discountAmount = ${da} WHERE id = ${id}`
    }

    const rows: any[] = await db.$queryRaw`SELECT * FROM Plan WHERE id = ${id}`
    const p = rows[0]
    return NextResponse.json({ success: true, plan: { ...p, features: (() => { try { return JSON.parse(p.features) } catch { return [] } })() } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try { await verifyAdminAuth(request) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const subCount = await db.subscription.count({ where: { planId: id } })
    if (subCount > 0) {
      await db.plan.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true, deactivated: true })
    }
    await db.plan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Delete failed' }, { status: 500 })
  }
}
