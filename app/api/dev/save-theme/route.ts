import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const config = await req.json()

    // 1. Update lib/config/devTheme.ts
    const devThemePath = path.join(process.cwd(), 'lib/config/devTheme.ts')
    let devThemeContent = `export const DEFAULT_CONFIG = {\n`
    for (const [key, value] of Object.entries(config)) {
      devThemeContent += `  "${key}": "${value}",\n`
    }
    // Remove last comma
    devThemeContent = devThemeContent.slice(0, -2) + '\n};\n'
    await fs.writeFile(devThemePath, devThemeContent, 'utf-8')

    // 2. Update globals.css
    const globalsCssPath = path.join(process.cwd(), 'app/globals.css')
    let globalsCss = await fs.readFile(globalsCssPath, 'utf-8')

    const rootStart = globalsCss.indexOf(':root {\n    /* Codemo Global Defaults')
    const rootEndMarker = '    /* Base Aliases (Light Mode) */'
    const rootEnd = globalsCss.indexOf(rootEndMarker)

    if (rootStart !== -1 && rootEnd !== -1) {
      let newRootContent = ':root {\n    /* Codemo Global Defaults (imported from latest dev-theme JSON) */\n'
      for (const [key, value] of Object.entries(config)) {
        // Only valid CSS values (no url(...) with unescaped stuff if needed, but it's safe since it's just raw strings)
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
