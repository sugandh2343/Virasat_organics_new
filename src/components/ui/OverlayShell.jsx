import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Buttons';
let openOverlays = 0;
let previousOverflow = '';
export default function OverlayShell({ open, onClose, title, description, children, footer, variant = 'modal', className = '', id, onKeyDown }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open) return;
    const trigger = document.activeElement;
    dialog.showModal();
    if (openOverlays++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    return () => {
      dialog.close();
      if (--openOverlays === 0) document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);
  return <dialog onKeyDown={onKeyDown} ref={ref} id={id} className={'overlay-shell overlay-shell--' + variant + ' ' + className} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <div className="overlay-header"><div><p className="eyebrow">VIRASAT ORGANICS</p><h2 id={titleId} className="section-title">{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><IconButton label={'Close ' + (variant === 'drawer' ? 'drawer' : 'dialog')} onClick={onClose}><X size={20} aria-hidden="true" /></IconButton></div><div className="overlay-content">{children}</div>{footer && <div className="overlay-footer">{footer}</div>}
  </dialog>;
}



