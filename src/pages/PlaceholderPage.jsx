export default function PlaceholderPage({ page }) {
  return <section className="container page-section"><p className="eyebrow">{page.label}</p><h1>{page.title}</h1><p className="intro">{page.description}</p><span className="status">Coming soon</span></section>;
}

