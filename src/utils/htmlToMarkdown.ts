/**
 * HTML-to-Markdown converter
 * Converts common HTML tags to markdown syntax.
 * Built from scratch without external libraries.
 */

interface ConversionResult {
  markdown: string
  title: string
  metaDescription: string
  images: string[]
}

/** Strip tags that should not appear in output */
function stripUnwantedTags(html: string): string {
  const tagsToStrip = [
    'script',
    'style',
    'nav',
    'footer',
    'header',
    'noscript',
    'iframe',
    'svg'
  ]
  let result = html
  for (const tag of tagsToStrip) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    result = result.replace(regex, '')
  }
  return result
}

/** Decode common HTML entities */
function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&laquo;': '«',
    '&raquo;': '»',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  }
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char)
  }
  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  )
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  )
  return result
}

/** Get attribute value from a tag */
function getAttr(tag: string, attr: string): string {
  const regex = new RegExp(
    `${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  )
  const match = tag.match(regex)
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : ''
}

/** Extract inner content of the first matching tag */
function extractTagContent(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = html.match(regex)
  return match ? match[1].trim() : ''
}

/** Convert inline formatting */
function convertInline(text: string): string {
  let result = text

  // Bold: <strong> and <b>
  result = result.replace(
    /<(?:strong|b)(?:\s[^>]*)?>([^<]*?)<\/(?:strong|b)>/gi,
    '**$1**'
  )

  // Italic: <em> and <i>
  result = result.replace(
    /<(?:em|i)(?:\s[^>]*)?>([^<]*?)<\/(?:em|i)>/gi,
    '*$1*'
  )

  // Inline code
  result = result.replace(/<code(?:\s[^>]*)?>([^<]*?)<\/code>/gi, '`$1`')

  // Links
  result = result.replace(
    /<a\s[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')(?:[^>]*)>([\s\S]*?)<\/a>/gi,
    (_, href1, href2, text) => {
      const href = href1 ?? href2 ?? ''
      const linkText = text.replace(/<[^>]+>/g, '').trim()
      return `[${linkText}](${href})`
    }
  )

  // Images
  result = result.replace(/<img\s([^>]*?)\/?>/gi, (_, attrs) => {
    const fullTag = `<img ${attrs}>`
    const src = getAttr(fullTag, 'src')
    const alt = getAttr(fullTag, 'alt')
    return src ? `![${alt}](${src})` : ''
  })

  // Line breaks
  result = result.replace(/<br\s*\/?>/gi, '\n')

  return result
}

/** Convert a list (ul/ol) to markdown */
function convertList(html: string, ordered: boolean): string {
  const items: string[] = []
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match
  let index = 1

  while ((match = liRegex.exec(html)) !== null) {
    let content = match[1].trim()
    // Recursively handle nested lists
    content = convertNestedLists(content)
    content = convertInline(content)
    content = content.replace(/<[^>]+>/g, '').trim()

    const prefix = ordered ? `${index}. ` : '- '
    items.push(`${prefix}${content}`)
    index++
  }

  return items.join('\n')
}

/** Handle nested lists within content */
function convertNestedLists(html: string): string {
  let result = html

  // Convert nested unordered lists
  result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    return (
      '\n' +
      convertList(inner, false)
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n')
    )
  })

  // Convert nested ordered lists
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    return (
      '\n' +
      convertList(inner, true)
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n')
    )
  })

  return result
}

/** Convert table HTML to markdown */
function convertTable(html: string): string {
  const rows: string[][] = []
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = []
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi
    let cellMatch

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      let content = cellMatch[1].trim()
      content = convertInline(content)
      content = content.replace(/<[^>]+>/g, '').trim()
      cells.push(content)
    }

    if (cells.length > 0) {
      rows.push(cells)
    }
  }

  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map((r) => r.length))
  const lines: string[] = []

  for (let i = 0; i < rows.length; i++) {
    // Pad row to colCount
    while (rows[i].length < colCount) rows[i].push('')
    lines.push('| ' + rows[i].join(' | ') + ' |')

    // Add separator after first row (header)
    if (i === 0) {
      lines.push('| ' + rows[i].map(() => '---').join(' | ') + ' |')
    }
  }

  return lines.join('\n')
}

/** Main HTML block conversion */
function convertBlocks(html: string): string {
  let result = html

  // Headings h1-h6
  for (let level = 1; level <= 6; level++) {
    const regex = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi')
    const hashes = '#'.repeat(level)
    result = result.replace(regex, (_, content) => {
      const text = convertInline(content)
        .replace(/<[^>]+>/g, '')
        .trim()
      return `\n\n${hashes} ${text}\n\n`
    })
  }

  // Pre/code blocks
  result = result.replace(
    /<pre[^>]*>\s*<code[^>]*(?:\s+class\s*=\s*(?:"[^"]*language-(\w+)[^"]*"|'[^']*language-(\w+)[^']*'))?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, lang1, lang2, code) => {
      const lang = lang1 ?? lang2 ?? ''
      const decoded = decodeEntities(code).trim()
      return `\n\n\`\`\`${lang}\n${decoded}\n\`\`\`\n\n`
    }
  )
  // Pre blocks without code
  result = result.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, content) => {
    const decoded = decodeEntities(content.replace(/<[^>]+>/g, '')).trim()
    return `\n\n\`\`\`\n${decoded}\n\`\`\`\n\n`
  })

  // Blockquotes
  result = result.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_, content) => {
      const text = convertInline(content)
        .replace(/<[^>]+>/g, '')
        .trim()
      const lines = text
        .split('\n')
        .map((line) => `> ${line.trim()}`)
        .join('\n')
      return `\n\n${lines}\n\n`
    }
  )

  // Tables
  result = result.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, inner) => {
    return `\n\n${convertTable(inner)}\n\n`
  })

  // Unordered lists
  result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    return `\n\n${convertList(inner, false)}\n\n`
  })

  // Ordered lists
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    return `\n\n${convertList(inner, true)}\n\n`
  })

  // Paragraphs
  result = result.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, content) => {
    const text = convertInline(content)
      .replace(/<[^>]+>/g, '')
      .trim()
    return text ? `\n\n${text}\n\n` : ''
  })

  // Horizontal rules
  result = result.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')

  // Divs and sections — just unwrap
  result = result.replace(
    /<\/?(?:div|section|article|main|aside|figure|figcaption|span)[^>]*>/gi,
    ''
  )

  // Convert remaining inline elements
  result = convertInline(result)

  return result
}

/** Extract all image URLs from HTML */
function extractImages(html: string): string[] {
  const images: string[] = []
  const imgRegex = /<img\s[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)')(?:[^>]*)>/gi
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1] ?? match[2]
    if (src) images.push(src)
  }

  return images
}

/** Extract title from HTML */
function extractTitle(html: string): string {
  // Try <h1> first
  const h1 = extractTagContent(html, 'h1')
  if (h1) return h1.replace(/<[^>]+>/g, '').trim()

  // Then <title>
  const title = extractTagContent(html, 'title')
  if (title) return title.replace(/<[^>]+>/g, '').trim()

  return ''
}

/** Extract meta description */
function extractMetaDescription(html: string): string {
  const match = html.match(
    /<meta\s[^>]*name\s*=\s*(?:"description"|'description')[^>]*content\s*=\s*(?:"([^"]*)"|'([^']*)')(?:[^>]*)>/i
  )
  if (match) return match[1] ?? match[2] ?? ''

  // Try reversed attribute order
  const match2 = html.match(
    /<meta\s[^>]*content\s*=\s*(?:"([^"]*)"|'([^']*)')(?:[^>]*)name\s*=\s*(?:"description"|'description')(?:[^>]*)>/i
  )
  if (match2) return match2[1] ?? match2[2] ?? ''

  return ''
}

/** Extract the main article content from a full HTML page */
function extractArticleContent(html: string): string {
  // Try <article> first
  const article = extractTagContent(html, 'article')
  if (article) return article

  // Try <main>
  const main = extractTagContent(html, 'main')
  if (main) return main

  // Try common content containers
  const contentPatterns = [
    /<div[^>]*class\s*=\s*(?:"[^"]*(?:post-content|article-content|entry-content|blog-content|content-body)[^"]*"|'[^']*(?:post-content|article-content|entry-content|blog-content|content-body)[^']*')[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id\s*=\s*(?:"content"|'content')[^>]*>([\s\S]*?)<\/div>/i
  ]

  for (const pattern of contentPatterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }

  // Try <body>
  const body = extractTagContent(html, 'body')
  if (body) return body

  return html
}

/** Clean up excessive whitespace in markdown output */
function cleanWhitespace(markdown: string): string {
  let result = markdown

  // Remove remaining HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '')

  // Remove any remaining HTML tags
  result = result.replace(/<[^>]+>/g, '')

  // Decode HTML entities in final output
  result = decodeEntities(result)

  // Normalize line endings
  result = result.replace(/\r\n/g, '\n')

  // Remove trailing whitespace from lines
  result = result.replace(/[ \t]+$/gm, '')

  // Collapse 3+ newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n')

  // Trim leading/trailing whitespace
  result = result.trim()

  return result
}

/**
 * Convert HTML string to markdown
 */
export function htmlToMarkdown(html: string): ConversionResult {
  const title = extractTitle(html)
  const metaDescription = extractMetaDescription(html)
  const images = extractImages(html)

  // Extract article content if it's a full page
  let content = html
  if (html.includes('<body') || html.includes('<html')) {
    content = extractArticleContent(html)
  }

  // Strip unwanted tags
  content = stripUnwantedTags(content)

  // Convert blocks
  let markdown = convertBlocks(content)

  // Clean up
  markdown = cleanWhitespace(markdown)

  return {
    markdown,
    title,
    metaDescription,
    images
  }
}

export default htmlToMarkdown
