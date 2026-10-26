// Crea le versioni web (miniatura 600px + grande 1600px) di tutti i JPG, senza toccare gli originali.
// Uso: node scripts/web-images.mjs <cartella originali> <cartella output>
import sharp from 'sharp'
import { readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join, parse } from 'node:path'

const [src, out] = process.argv.slice(2)
const sizes = [['thumbs', 600, 75], ['large', 1600, 82]]
for (const [dir] of sizes) mkdirSync(join(out, dir), { recursive: true })

const files = readdirSync(src).filter(f => /\.jpe?g$/i.test(f))
let done = 0, failed = []
for (const f of files) {
  const name = parse(f).name + '.jpg'
  try {
    for (const [dir, max, quality] of sizes) {
      const dest = join(out, dir, name)
      if (existsSync(dest)) continue
      await sharp(join(src, f)).rotate()
        .resize(max, max, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toFile(dest)
    }
  } catch (e) { failed.push(`${f}: ${e.message}`) }
  if (++done % 100 === 0) console.log(`${done}/${files.length}`)
}
console.log(`fatto: ${done} file, errori: ${failed.length}`)
failed.forEach(f => console.log('  ' + f))
