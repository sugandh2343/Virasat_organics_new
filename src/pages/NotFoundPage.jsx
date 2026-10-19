import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return <section className="container page-section"><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>Let’s return to our roots.</h1><p className="intro">This page could not be found.</p><Link className="button" to="/">Back to home</Link></section>;
}

