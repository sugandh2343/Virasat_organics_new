import { useCatalogueLinks } from '../hooks/useCatalogueLinks';
import { visibleCompliance } from '../domain/contentSelectors';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Globe, Phone, Mail, MessageCircle, Leaf } from 'lucide-react';
import Brand from './Brand';
import { Container } from './ui';
import { useBusiness } from '../state/BusinessContext';
import { companyLinks, supportLinks } from '../mock-data/navigation';
const socialIcons = { Instagram, Facebook, YouTube: Youtube };
function FooterLinks({ title, links }) {
  return <nav className="footer-column" aria-label={'Footer ' + title}><h2>{title}</h2><ul>{links.map(link => <li key={link.path}><Link to={link.path}>{link.label}</Link></li>)}</ul></nav>;
}
export default function Footer() {
  const business=useBusiness();
  const shopLinks=useCatalogueLinks();
  const year = new Date().getFullYear();
  const contacts = [
    { label: 'WhatsApp', Icon: MessageCircle, value: business.whatsapp, href: business.whatsapp ? 'https://wa.me/' + business.whatsapp.replace(/\D/g, '') : null },
    { label: 'Phone', Icon: Phone, value: business.phone, href: business.phone ? 'tel:' + business.phone.replace(/[^+\d]/g, '') : null },
    { label: 'Email', Icon: Mail, value: business.email, href: business.email ? 'mailto:' + business.email : null },
  ];
  return <footer className="site-footer premium-footer">
    <Container>
      <div className="footer-topline"><p className="footer-motto">Rooted in tradition.<br /><em>Made for everyday goodness.</em></p><Leaf size={48} strokeWidth={.7} aria-hidden="true" /></div>
      <div className="footer-grid">
        <div className="footer-brand"><Brand />{business.footerDescriptionVisible!==false&&<p>{business.introduction}</p>}{business.contactsVisible!==false&&business.address && <address>{business.address}</address>}</div>
        <FooterLinks title="Shop" links={shopLinks} />
        <FooterLinks title="Company" links={companyLinks} />
        <FooterLinks title="Customer Support" links={supportLinks} />
        <div className="footer-column footer-connect"><h2>Connect</h2><ul>{(business.contactsVisible===false?[]:contacts).map(({ label, Icon, value, href }) => <li key={label}>{value && href ? <a href={href}><Icon size={16} aria-hidden="true" /><span>{label}<small>{value}</small></span></a> : <span className="contact-pending"><Icon size={16} aria-hidden="true" /><span>{label}<small>Details coming soon</small></span></span>}</li>)}</ul>
          <div className="footer-socials">{business.socialLinks.length ? business.socialLinks.map(social => { const Icon = socialIcons[social.label] || Globe; return <a key={social.label} href={social.url} aria-label={social.label}><Icon size={18} aria-hidden="true" /></a>; }) : (business.socialPlaceholders ?? []).map(label => { const Icon = socialIcons[label] || Globe; return <span key={label} role="img" aria-label={label + ' link coming soon'} title={label + ' link coming soon'}><Icon size={18} aria-hidden="true" /></span>; })}</div>
          {!business.socialLinks.length && <p className="social-pending">Social links coming soon</p>}
        </div>
      </div>
      {(visibleCompliance(business.gstin,'gstin') || visibleCompliance(business.fssai,'fssai')) && <div className="footer-registration">{visibleCompliance(business.gstin,'gstin') && <span>GSTIN: {business.gstin.value}</span>}{visibleCompliance(business.fssai,'fssai') && <span>FSSAI: {business.fssai.value}</span>}</div>}
      <div className="footer-bottom"><p>© {year} {business.name}. All rights reserved.</p><nav aria-label="Legal"><Link to="/privacy-policy">Privacy</Link><Link to="/terms-and-conditions">Terms & Conditions</Link></nav></div>
      <p className="footer-preview-note">{business.footerNote}</p>
    </Container>
  </footer>;
}




