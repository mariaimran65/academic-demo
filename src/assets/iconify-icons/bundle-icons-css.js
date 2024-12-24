import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'

// Import Iconify JSON directly as ES modules
import tablerJson from '@iconify/json/json/tabler.json'

import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import { getIcons, getIconsCSS, stringToIcon } from '@iconify/utils'

const sources = {
  json: [
    tablerJson // Direct import instead of require.resolve
  ],
  svg: [
    /* Example for custom SVG icons
    {
      dir: 'src/assets/iconify-icons/svg',
      monotone: false,
      prefix: 'custom'
    } */
  ]
}

// File to save bundle to
const target = join(process.cwd(), 'generated-icons.css')

;(async function () {
  try {
    // Create directory for output if missing
    const dir = dirname(target)

    await fs.mkdir(dir, { recursive: true })

    const allIcons = []

    // Process JSON sources
    if (sources.json) {
      for (const content of sources.json) {
        if (content.icons?.length) {
          const filteredContent = getIcons(content, content.icons)

          if (!filteredContent) throw new Error(`Cannot find required icons`)
          allIcons.push(filteredContent)
        } else {
          allIcons.push(content)
        }
      }
    }

    // Process SVG sources
    if (sources.svg) {
      for (const source of sources.svg) {
        const iconSet = await importDirectory(source.dir, { prefix: source.prefix })

        await iconSet.forEach(async (name, type) => {
          if (type !== 'icon') return
          const svg = iconSet.toSVG(name)

          if (!svg) {
            iconSet.remove(name)

            return
          }

          try {
            await cleanupSVG(svg)

            if (source.monotone) {
              await parseColors(svg, {
                defaultColor: 'currentColor',
                callback: (attr, colorStr, color) => {
                  return !color || isEmptyColor(color) ? colorStr : 'currentColor'
                }
              })
            }

            await runSVGO(svg)
          } catch (err) {
            console.error(`Error parsing ${name} from ${source.dir}:`, err)
            iconSet.remove(name)

            return
          }

          iconSet.fromSVG(name, svg)
        })

        allIcons.push(iconSet.export())
      }
    }

    // Generate CSS
    const cssContent = allIcons
      .map(iconSet =>
        getIconsCSS(iconSet, Object.keys(iconSet.icons), {
          iconSelector: '.{prefix}-{name}'
        })
      )
      .join('\\n')

    // Save CSS to file
    await fs.writeFile(target, cssContent, 'utf8')
    console.log(`Saved CSS to ${target}!`)
  } catch (err) {
    console.error(err)
  }
})()

function organizeIconsList(icons) {
  const sorted = Object.create(null)

  icons.forEach(icon => {
    const item = stringToIcon(icon)

    if (!item) return
    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])
    const name = item.name

    if (!prefixList.includes(name)) prefixList.push(name)
  })

  return sorted
}
