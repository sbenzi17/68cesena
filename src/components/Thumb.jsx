import { Link } from 'react-router-dom'

export default function Thumb({ photo, onClick }) {
  return (
    <Link
      to={`/foto/${photo.id}`}
      className="thumb"
      onClick={(e) => {
        if (onClick && photo.src) {
          e.preventDefault();
          onClick(photo);
        }
      }}
    >
      <div className={`thumb-img ${photo.bg}${photo.src ? ' has-img' : ''}`} data-label={photo.label}>
        {photo.src && <img src={photo.src} alt={photo.caption} loading="lazy" />}
      </div>
      <div className="thumb-caption">{photo.caption}</div>
    </Link>
  );
}
