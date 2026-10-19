import { SecondaryButton } from './Buttons';
export function LoadingState({label = 'Loading preview…'}) { return <div className="container page-section" role="status">{label}</div>; }
export function ErrorState({retry}) { return <section className="container page-section" role="alert"><h1>Something went wrong.</h1><p>Please try loading this local preview again.</p>{retry && <SecondaryButton onClick={retry}>Try again</SecondaryButton>}</section>; }
export function PlaceholderState({title, description, label = 'Static preview'}) { return <section className="container page-section"><p className="eyebrow">{label}</p><h1>{title}</h1><p className="intro">{description || 'This screen is reserved for a future phase. No live service is connected.'}</p><span className="status">Placeholder · Local demo only</span></section>; }

