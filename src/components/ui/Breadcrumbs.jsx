import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
export default function Breadcrumbs({ items = [] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={index}>{index > 0 && <ChevronRight size={12} aria-hidden="true" />}{index === items.length - 1 ? <span aria-current="page">{item.label}</span> : <Link to={item.to || '/'}>{item.label}</Link>}</li>)}</ol></nav>;
}

