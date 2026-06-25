import fs from 'node:fs'
import { AppConfig } from 'config.js'
import { instanceCachingFactory } from 'tsyringe'
import path from 'node:path'
const __dirname = import.meta.dirname

/**
 * Resolve a JWT key from an env value that may be either:
 *   1. The PEM key material itself (production: single-line with `\n` escapes,
 *      or multi-line with real newlines). May be wrapped in single/double quotes.
 *   2. A relative file path (local dev, e.g. `keys/private.pem`).
 *
 * For PEM env content, literal `\n` two-char sequences are converted to real
 * newlines so the resulting PEM is a valid asymmetric key for RS256.
 * Key contents are never logged.
 */
function resolveKey(value: string, envVarName: string): Buffer {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  if (trimmed.includes('-----BEGIN')) {
    return Buffer.from(trimmed.replace(/\\n/g, '\n'))
  }
  if (!trimmed) {
    throw new Error(`${envVarName} is not set`)
  }
  const keyPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    trimmed
  )
  return fs.readFileSync(keyPath)
}

export default {
  token: 'middleware.jwt.config.keys',
  useFactory: instanceCachingFactory((container) => {
    const config = container.resolve<AppConfig>('config')
    return {
      private: resolveKey(config.auth.jwt.privateKey, 'JWT_PRIVATE_KEY'),
      public: resolveKey(config.auth.jwt.publicKey, 'JWT_PUBLIC_KEY')
    }
  })
}
