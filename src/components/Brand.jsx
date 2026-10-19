import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../state/BusinessContext';
export default function Brand({ onClick }) {
  const business=useBusiness();
  return <Link className="brand" to="/" onClick={onClick} aria-label={business.name + ' home'}>
    {business.logoSrc ? <img className="brand-logo" src={business.logoSrc} alt={business.logoAlt} /> : <>
      <span className="brand-seal"><Sprout size={25} strokeWidth={1.2} aria-hidden="true" /></span>
      <span><span className="brand-hindi" lang="hi">{business.hindiName}</span><span className="brand-name">{business.name}</span></span>
    </>}
  </Link>;
}


