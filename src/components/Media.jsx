import { videoInfo } from '../data/photos'

// Video incorporato: YouTube (versione senza cookie) oppure file video con il lettore del browser.
// `autoplay` fa partire il video appena compare (usato nell'ingrandimento delle miniature)
export function VideoEmbed({ url, info = videoInfo(url), title = 'Video', autoplay = false }) {
  if (!info) return null
  return (
    <div className="media-video">
      {info.tipo === 'youtube' ? (
        <iframe
          src={`${info.embed}${autoplay ? '?autoplay=1&rel=0' : '?rel=0'}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <video src={info.src} controls preload="metadata" autoPlay={autoplay} playsInline title={title}>
          Il tuo browser non riesce a riprodurre questo video: <a href={info.src}>aprilo qui</a>.
        </video>
      )}
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
