import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed' }, { status: 400 })
    }

    // Convert to base64 and save in database
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const imageUrl = `data:${file.type};base64,${base64}`

    await db.user.update({
      where: { id: decoded.userId },
      data: { profileImage: imageUrl }
    })

    return NextResponse.json({ message: 'Profile image uploaded successfully', imageUrl }, { status: 200 })

  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}