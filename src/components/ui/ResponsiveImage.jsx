import { useState } from 'react';
import { ImageOff, Leaf } from 'lucide-react';
function ImageFrame({ src, alt, srcSet, sizes = '(min-width: 64rem) 25vw, (min-width: 48rem) 50vw, 100vw', aspectRatio = '4 / 5', fit = 'contain', className = '', loading = 'lazy' }) {
  const [state, setState] = useState(src ? 'loading' : 'empty');
  const missing = state === 'error' || state === 'empty';
  const Icon = state === 'error' ? ImageOff : Leaf;
  return <div className={'responsive-image ' + className + (state === 'loading' ? ' is-loading' : '')} style={{ aspectRatio, '--image-fit': fit }} aria-busy={state === 'loading' || undefined}>
    {missing ? <div className="image-placeholder" role="img" aria-label={alt + ' — image unavailable'}><Icon size={30} strokeWidth={1} aria-hidden="true" /><span>{state === 'error' ? 'Image unavailable' : 'Photography coming soon'}</span><small>Temporary placeholder</small></div> : <>
      {state === 'loading' && <span className="image-loading skeleton" aria-hidden="true" />}
      <img src={src} alt={alt} srcSet={srcSet} sizes={srcSet ? sizes : undefined} loading={loading} decoding="async" onLoad={() => setState('loaded')} onError={() => setState('error')} />
    </>}
  </div>;
}
export default function ResponsiveImage(props) {
  // Remount on source changes to reset failed/loading states.
  return <ImageFrame key={props.src || 'empty'} {...props} />;
}

