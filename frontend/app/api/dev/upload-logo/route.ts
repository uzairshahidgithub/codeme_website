import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name) || '.png'
    const fileName = `custom-logo-${Date.now()}${ext}`
    const filePath = path.join(process.cwd(), 'public', 'icons', fileName)
    
    await fs.writeFile(filePath, buffer)
    
    return NextResponse.json({ success: true, url: `/icons/${fileName}` })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
