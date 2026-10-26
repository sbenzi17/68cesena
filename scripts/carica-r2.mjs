// Carica su Cloudflare R2 le versioni web delle immagini (thumbs/, large/) e i PDF (pdf/).
// Salta i file già presenti con la stessa dimensione, quindi si può rilanciare senza problemi.
// Uso: node scripts/carica-r2.mjs <cartella con thumbs e large> [cartella pdf]
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from './env.mjs'

const env = loadEnv()
const [webDir, pdfDir] = process.argv.slice(2)
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
})
const Bucket = env.R2_BUCKET || 'archivio-foto'

const existing = new Map()
let token
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken: token }))
  for (const o of page.Contents || []) existing.set(o.Key, o.Size)
  token = page.NextContinuationToken
} while (token)

const jobs = []
for (const dir of ['thumbs', 'large']) {
  for (const f of readdirSync(join(webDir, dir))) jobs.push({ key: `${dir}/${f}`, path: join(webDir, dir, f), type: 'image/jpeg' })
}
if (pdfDir && existsSync(pdfDir)) {
  for (const f of readdirSync(pdfDir).filter(f => f.endsWith('.pdf'))) jobs.push({ key: `pdf/${f}`, path: join(pdfDir, f), type: 'application/pdf' })
}
const todo = jobs.filter(j => existing.get(j.key) !== statSync(j.path).size)
console.log(`${jobs.length} file, ${jobs.length - todo.length} già caricati, ${todo.length} da caricare`)

let done = 0
async function worker() {
  while (todo.length) {
    const j = todo.shift()
    await s3.send(new PutObjectCommand({
      Bucket, Key: j.key, Body: readFileSync(j.path), ContentType: j.type, CacheControl: 'public, max-age=86400',
    }))
    if (++done % 100 === 0) console.log(`  ${done} caricati`)
  }
}
await Promise.all(Array.from({ length: 8 }, worker))
console.log(`fatto: ${done} caricati`)
