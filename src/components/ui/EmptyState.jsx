import { Sprout } from 'lucide-react';
export default function EmptyState({ title = 'Something good is taking root.', description = 'There is nothing to display here yet.', icon: Icon = Sprout, children }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon size={30} strokeWidth={1.2} aria-hidden="true" /></span><h3 className="product-title">{title}</h3><p>{description}</p>{children}</div>;
}

