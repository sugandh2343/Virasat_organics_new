import { Star } from 'lucide-react';
export default function RatingDisplay({ value = null, count = null, demo = false }) {
  const valid = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5;
  if (!valid) return <span className="rating-empty">No ratings yet</span>;
  return <div className="rating-display"><span className="rating-stars" role="img" aria-label={value + ' out of 5 stars'}>{Array.from({ length: 5 }, (_, i) => <span className="rating-star" key={i}><Star size={16} aria-hidden="true" /><span className="rating-fill" style={{ width: Math.min(1, Math.max(0, value - i)) * 100 + '%' }}><Star size={16} aria-hidden="true" /></span></span>)}</span><span>{value.toFixed(1)}{Number.isInteger(count) && count >= 0 ? ' (' + count + ')' : ''}</span>{demo && <span className="demo-label">Demo only · not customer reviews</span>}</div>;
}

