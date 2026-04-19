import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    // Verify user auth
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { type: string }
    if (decoded.type !== 'user') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10MB allowed' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ success: true, url: dataUrl })
  } catch (error: any) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
