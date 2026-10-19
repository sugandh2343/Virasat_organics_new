export default function SkeletonLoader({ variant = 'text', lines = 3, label = 'Loading content' }) {
  return <div className={'skeleton-loader skeleton-loader--' + variant} role="status"><span className="sr-only">{label}</span>{variant === 'card' && <div className="skeleton skeleton-image" />}{Array.from({ length: Math.max(1, Math.min(lines, 10)) }, (_, i) => <div key={i} className="skeleton skeleton-line" />)}</div>;
}

