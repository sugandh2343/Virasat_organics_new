export default function SectionHeading({ eyebrow, title, description, as: Tag = 'h2', children, className = '' }) {
  return <div className={'section-heading ' + className}><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<Tag className="section-title">{title}</Tag>{description && <p className="section-description">{description}</p>}</div>{children && <div className="section-heading-action">{children}</div>}</div>;
}

