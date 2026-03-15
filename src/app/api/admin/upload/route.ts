import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { verifyAdminAuth } from '../helpers'

export async function POST(request: NextRequest) {
  try {
    await verifyAdminAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Only image or video files allowed' }, { status: 400 })
    }

    const maxSize = file.type.startsWith('video/') ? 500 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size must be less than ${file.type.startsWith('video/') ? '500MB' : '10MB'}` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop()
    const folder = file.type.startsWith('video/') ? 'videos' : 'gallery'
    const filename = `${folder}-${Date.now()}.${ext}`
    const path = join(process.cwd(), 'public', 'uploads', folder, filename)

    await writeFile(path, buffer)

    return NextResponse.json({
      success: true,
      url: `/uploads/${folder}/${filename}`
    })
  } catch (error: any) {
    if (error.message === 'Not authenticated' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
