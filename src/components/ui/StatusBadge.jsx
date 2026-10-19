const labels = { active: 'Available', inactive: 'Inactive', out_of_stock: 'Out of stock', coming_soon: 'Coming soon' };
export default function StatusBadge({ status = 'coming_soon' }) {
  const safeStatus = labels[status] ? status : 'coming_soon';
  return <span className={'status-badge status-badge--' + safeStatus}><span aria-hidden="true" className="status-dot" />{labels[safeStatus]}</span>;
}

