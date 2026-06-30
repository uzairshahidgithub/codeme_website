import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { canAccessDevTools } from '@/lib/roles'
import { getProfileForUser } from '@/lib/admin/auth'

async function assertDevAccess() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const profile = await getProfileForUser(user.id)
  if (!profile || !canAccessDevTools(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function POST(req: Request) {
  const denied = await assertDevAccess()
  if (denied) return denied

  try {
    const config = await req.json()

    const devThemePath = path.join(process.cwd(), 'lib/config/devTheme.ts')
    let devThemeContent = `export const DEFAULT_CONFIG = {\n`
    for (const [key, value] of Object.entries(config)) {
      devThemeContent += `  "${key}": "${value}",\n`
    }
    devThemeContent = devThemeContent.slice(0, -2) + '\n};\n'
    await fs.writeFile(devThemePath, devThemeContent, 'utf-8')

    const globalsCssPath = path.join(process.cwd(), 'app/globals.css')
    let globalsCss = await fs.readFile(globalsCssPath, 'utf-8')

    const rootStart = globalsCss.indexOf(':root {\n    /* Codemo Global Defaults')
    const rootEndMarker = '    /* Base Aliases (Light Mode) */'
    const rootEnd = globalsCss.indexOf(rootEndMarker)

    if (rootStart !== -1 && rootEnd !== -1) {
      let newRootContent = ':root {\n    /* Codemo Global Defaults (imported from latest dev-theme JSON) */\n'
      for (const [key, value] of Object.entries(config)) {
        newRootContent += `    ${key}: ${value};\n`
      }
      newRootContent += '\n'

      globalsCss = globalsCss.substring(0, rootStart) + newRootContent + globalsCss.substring(rootEnd)
      await fs.writeFile(globalsCssPath, globalsCss, 'utf-8')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to save theme:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
