/**
 * Backfill AI auto-tags for existing blog posts (Track 3).
 *
 * Iterates blogs with `auto_tagged_at IS NULL`, calls BlogService.runAutoTag
 * for each, and rate-limits to 1 call/sec to avoid burning Anthropic credits.
 * Prints progress + a cumulative token-usage cost estimate.
 *
 * Run with:
 *   cd backend
 *   npx tsx scripts/backfill-blog-tags.ts
 *   # or, dry-run mode (no API calls, just count):
 *   npx tsx scripts/backfill-blog-tags.ts --dry-run
 */
import 'reflect-metadata'
import '../src/providers/index.js'
import { container } from 'tsyringe'
import { BlogRepository } from '../src/repository/blogs.js'
import { BlogService } from '../src/services/blogs.js'

// Rough Anthropic pricing for claude-haiku-4-5 (per 1M tokens).
// Update if the priced changes — this is just an estimate for the log line.
const PRICE_INPUT_PER_M = 0.8
const PRICE_OUTPUT_PER_M = 4

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const repo = container.resolve(BlogRepository)
  const service = container.resolve(BlogService)

  const blogs = await repo.getBlogsMissingAutoTags(1000)
  console.log(`[backfill] found ${blogs.length} blogs missing auto_tagged_at`)
  if (dryRun) {
    console.log('[backfill] --dry-run: exiting without calling the API')
    process.exit(0)
  }

  let inputTokens = 0
  let outputTokens = 0
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i]!
    const tag = `[backfill ${i + 1}/${blogs.length}]`
    try {
      const result = await service.runAutoTag(blog)
      inputTokens += result.meta.input_tokens
      outputTokens += result.meta.output_tokens
      if (result.meta.ok) {
        succeeded++
        const counts = [
          `cities=${result.structured.cities.length}`,
          `counties=${result.structured.counties.length}`,
          `topics=${result.structured.topics.length}`,
          `audience=${result.structured.audience.length}`,
          `season=${result.structured.seasonality.length}`
        ].join(' ')
        console.log(`${tag} ok  id=${blog.id} ${counts}`)
      } else {
        failed++
        console.warn(`${tag} fail id=${blog.id} error=${result.meta.error || 'unknown'}`)
      }
    } catch (err) {
      failed++
      console.error(`${tag} threw id=${blog.id}`, err)
    }
    // Rate-limit between calls. Sleep even after the last call is harmless
    // and keeps the loop boring.
    await sleep(1000)
  }

  const estCost = (inputTokens / 1_000_000) * PRICE_INPUT_PER_M
    + (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  console.log('---')
  console.log(`[backfill] done. succeeded=${succeeded} failed=${failed}`)
  console.log(
    `[backfill] tokens: in=${inputTokens} out=${outputTokens} ~$${estCost.toFixed(4)} USD`
  )
  process.exit(0)
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

main().catch(err => {
  console.error('[backfill] fatal', err)
  process.exit(1)
})
