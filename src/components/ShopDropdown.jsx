import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { useCatalogueLinks } from '../hooks/useCatalogueLinks';
export default function ShopDropdown() {
  const shopLinks=useCatalogueLinks();
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => {
    if (!open) return;
    const dismiss = event => { if (!wrapper.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  return <div ref={wrapper} className="shop-dropdown"
    onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && !wrapper.current.contains(document.activeElement)) setOpen(false); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current.focus(); }
      if (event.key === 'ArrowDown' && event.target === trigger.current) {
        event.preventDefault(); setOpen(true);
        requestAnimationFrame(() => wrapper.current.querySelector('.shop-dropdown-panel a')?.focus());
      }
    }}>
    <button ref={trigger} type="button" className={'nav-shop-trigger' + (location.pathname.startsWith('/shop') ? ' active' : '')}
      aria-expanded={open} aria-controls="desktop-shop-links" onClick={() => setOpen(value => !value)}>Shop <ChevronDown size={13} aria-hidden="true" /></button>
    <div className="shop-dropdown-panel" id="desktop-shop-links" hidden={!open}><p className="eyebrow">THE VIRASAT PANTRY</p>{shopLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></Link>)}</div>
  </div>;
}


