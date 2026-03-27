import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const uaLower = ua.toLowerCase()
  if (/ipad|tablet|(android(?!.*mobile))|kindle|playbook|silk/.test(uaLower)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(uaLower)) return 'mobile'
  return 'desktop'
}

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json().catch(() => ({ path: '/' }))

    let visitorId = request.cookies.get('visitor-id')?.value
    const isNew = !visitorId
    if (!visitorId) visitorId = crypto.randomUUID()

    const ua = request.headers.get('user-agent') || ''
    const deviceType = detectDevice(ua)

    await db.siteVisit.create({
      data: { id: crypto.randomUUID(), visitorId, path: path || '/', deviceType }
    })

    const res = NextResponse.json({ success: true })
    if (isNew) {
      res.cookies.set('visitor-id', visitorId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
      })
    }
    return res
  } catch {
    return NextResponse.json({ success: false })
  }
}
