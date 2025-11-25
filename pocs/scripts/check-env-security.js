#!/usr/bin/env node

/**
 * Security check script to ensure no sensitive environment variables
 * are accidentally bundled into production builds
 */

const fs = require('fs')
const path = require('path')

// List of sensitive environment variable patterns
const SENSITIVE_PATTERNS = [
  /API_KEY/i,
  /SECRET/i,
  /TOKEN/i,
  /PASSWORD/i,
  /PRIVATE/i
]

// Directories to check for bundled environment variables
const BUILD_DIRS = ['storybook-static', '.next', 'dist', 'build']

function findJSFiles(dir) {
  const files = []

  if (!fs.existsSync(dir)) {
    return files
  }

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

function checkFileForSensitiveVars(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const findings = []

    for (const pattern of SENSITIVE_PATTERNS) {
      const matches = content.match(
        new RegExp(`process\\.env\\.[A-Z_]*${pattern.source}[A-Z_]*`, 'gi')
      )
      if (matches) {
        findings.push(...matches)
      }
    }

    return findings
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}`)
    return []
  }
}

function main() {
  console.log(
    '🔍 Checking for exposed environment variables in build artifacts...\n'
  )

  let foundSensitiveVars = false

  for (const buildDir of BUILD_DIRS) {
    if (!fs.existsSync(buildDir)) {
      console.log(`📁 ${buildDir}/ - Not found (skipping)`)
      continue
    }

    console.log(`📁 ${buildDir}/ - Checking...`)
    const jsFiles = findJSFiles(buildDir)

    for (const file of jsFiles) {
      const findings = checkFileForSensitiveVars(file)
      if (findings.length > 0) {
        foundSensitiveVars = true
        console.log(`  ❌ ${path.relative('.', file)}`)
        for (const finding of findings) {
          console.log(`     🚨 Found: ${finding}`)
        }
      }
    }

    if (jsFiles.length === 0) {
      console.log(`     ℹ️  No JS files found`)
    } else {
      console.log(`     ✅ Checked ${jsFiles.length} files`)
    }
  }

  console.log('\n' + '='.repeat(50))

  if (foundSensitiveVars) {
    console.log(
      '🚨 SECURITY ALERT: Sensitive environment variables detected in build artifacts!'
    )
    console.log('')
    console.log('Action required:')
    console.log('1. Remove sensitive environment variables from your code')
    console.log('2. Use props or secure server-side handling instead')
    console.log('3. Rebuild and redeploy')
    console.log('4. Consider regenerating exposed API keys')
    process.exit(1)
  } else {
    console.log(
      '✅ No sensitive environment variables found in build artifacts'
    )
    console.log('🔒 Security check passed!')
  }
}

if (require.main === module) {
  main()
}

module.exports = { checkFileForSensitiveVars, findJSFiles }
