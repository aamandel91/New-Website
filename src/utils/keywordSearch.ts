/**
 * Keyword regex search for property public remarks / descriptions.
 *
 * Syntax:
 *   pool           → matches "pool" (case-insensitive)
 *   "heated pool"  → matches exact phrase
 *   pool | spa     → matches either term
 *   -foreclosure   → excludes properties containing "foreclosure"
 */

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface KeywordParseResult {
  regex: RegExp | null
  excludeTerms: string[]
  raw: string
}

/**
 * Parse a user query string into a RegExp for matching and a list of exclude terms.
 */
export function parseKeywordQuery(query: string): KeywordParseResult {
  const raw = query.trim()
  if (!raw) return { regex: null, excludeTerms: [], raw }

  const excludeTerms: string[] = []
  const includePatterns: string[] = []

  // Split on pipe for OR groups, then handle each segment
  const orSegments = raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const segment of orSegments) {
    // Tokenize: quoted phrases, -exclude terms, and plain words
    const tokens = segment.match(/"[^"]+"|[^\s]+/g) || []

    const segmentParts: string[] = []

    for (const token of tokens) {
      if (token.startsWith('-') && token.length > 1) {
        // Exclude term: strip leading dash and quotes
        const term = token.slice(1).replace(/^"|"$/g, '')
        excludeTerms.push(term.toLowerCase())
      } else {
        // Include term: strip quotes
        const term = token.replace(/^"|"$/g, '')
        if (term) segmentParts.push(escapeRegex(term))
      }
    }

    if (segmentParts.length > 0) {
      // Join tokens within a segment as a phrase (space-separated)
      includePatterns.push(segmentParts.join('\\s+'))
    }
  }

  if (includePatterns.length === 0) {
    return { regex: null, excludeTerms, raw }
  }

  const pattern = includePatterns.join('|')
  const regex = new RegExp(pattern, 'gi')

  return { regex, excludeTerms, raw }
}

/**
 * Build a RegExp from a user query string.
 */
export function buildKeywordRegex(query: string): RegExp | null {
  return parseKeywordQuery(query).regex
}

/**
 * Test whether the remarks text matches the regex and does not contain excluded terms.
 */
export function matchesKeyword(
  remarks: string,
  regex: RegExp | null,
  excludeTerms: string[] = []
): boolean {
  if (!remarks) return false

  const lower = remarks.toLowerCase()

  // Check exclusions first
  for (const term of excludeTerms) {
    if (lower.includes(term)) return false
  }

  // If no include regex, match everything not excluded
  if (!regex) return true

  // Reset lastIndex since regex is global
  regex.lastIndex = 0
  return regex.test(remarks)
}

/**
 * Wrap regex matches in <mark> tags for highlighting.
 */
export function highlightMatches(text: string, regex: RegExp | null): string {
  if (!regex || !text) return text
  regex.lastIndex = 0
  return text.replace(regex, (match) => `<mark>${match}</mark>`)
}
