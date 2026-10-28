import { youtubeEmbed } from '../data/photos'

// Video di YouTube incorporato (versione senza cookie)
export function VideoEmbed({ url, title = 'Video' }) {
  const src = youtubeEmbed(url)
  if (!src) return null
  return (
    <div className="media-video">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

// Lettore audio del browser
export function AudioPlayer({ src, label = 'Audio' }) {
  if (!src) return null
  return (
    <div className="media-audio">
      <p>♪ {label}</p>
      <audio controls preload="metadata" src={src}>
        Il tuo browser non riesce a riprodurre questo audio: <a href={src}>scaricalo</a>.
      </audio>
    </div>
  )
}
