#!/usr/bin/env node
/**
 * Performance budget check — fails the build when a route's first-load
 * client JS exceeds its budget.
 *
 * Reads .next/app-build-manifest.json (run `npm run build` first), gzips
 * every script the route ships on first load, and compares the total against
 * the budgets below. This exists because the homepage once crept to 1.28MB
 * without anything noticing; keep budgets tight and raise them only with a
 * deliberate decision in code review.
 *
 * Usage: node scripts/check-bundle-budget.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Budgets are gzip bytes of first-load JS (route files ∪ root layout files,
// as listed in app-build-manifest — slightly stricter than the "First Load JS"
// column `next build` prints, since it also counts route-referenced async
// chunks). Actuals at the time budgets were set are noted alongside; raise a
// budget only as a deliberate, reviewed decision.
const BUDGETS = [
  { page: '/page', label: 'homepage', budget: 380 * 1024 }, // ~353KB actual
  { page: '/homedetails/[slug]/page', label: 'homedetails', budget: 470 * 1024 }, // ~425KB actual
  { page: '/homes/[slug]/page', label: 'homes', budget: 580 * 1024 } // ~530KB actual
]

const manifestPath = join(process.cwd(), '.next', 'app-build-manifest.json')

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
} catch {
  console.error(`✖ Could not read ${manifestPath} — run \`npm run build\` first.`)
  process.exit(1)
}

const gzipSizeOf = (file) => {
  const buf = readFileSync(join(process.cwd(), '.next', file))
  return gzipSync(buf, { level: 9 }).length
}

const layoutFiles = manifest.pages['/layout'] ?? []

let failed = false
for (const { page, label, budget } of BUDGETS) {
  const pageFiles = manifest.pages[page]
  if (!pageFiles) {
    console.error(`✖ ${label}: route "${page}" not found in app-build-manifest.json`)
    failed = true
    continue
  }

  const files = [...new Set([...layoutFiles, ...pageFiles])].filter((f) =>
    f.endsWith('.js')
  )
  const total = files.reduce((sum, f) => sum + gzipSizeOf(f), 0)
  const kb = (n) => `${(n / 1024).toFixed(0)}KB`
  const over = total > budget

  console.log(
    `${over ? '✖' : '✓'} ${label}: ${kb(total)} gzip first-load JS (budget ${kb(budget)}, ${files.length} files)`
  )
  if (over) failed = true
}

if (failed) {
  console.error(
    '\nBundle budget exceeded. Find the culprit with `ANALYZE=1 npm run build` (writes stats.json with import chains).\n' +
      'Common causes: importing a barrel (index.ts) instead of the module directly, or a static import of a heavy library that should be dynamic.'
  )
  process.exit(1)
}
console.log('\nAll bundle budgets OK.')
