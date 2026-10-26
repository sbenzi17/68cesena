// Legge .env.local (non viene mai committato: contiene chiavi segrete)
import { readFileSync, existsSync } from 'node:fs'

export function loadEnv(path = '.env.local') {
  if (!existsSync(path)) throw new Error(`Manca ${path}: vedi SETUP.md`)
  const env = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
