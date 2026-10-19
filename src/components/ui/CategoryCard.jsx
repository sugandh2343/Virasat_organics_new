import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveImage from './ResponsiveImage';
export default function CategoryCard({ title, description, image, to }) {
  return <Link to={to} className="category-card"><ResponsiveImage src={image?.src} alt={image?.alt || title} aspectRatio="1" /><div><h3 className="product-title">{title}</h3>{description && <p>{description}</p>}</div><ArrowUpRight size={20} aria-hidden="true" /></Link>;
}

