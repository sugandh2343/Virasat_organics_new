import { Link } from 'react-router-dom';
function Button({ to, href, disabled = false, loading = false, children, className = '', variant, ...props }) {
  const classes = 'button button--' + variant + ' ' + className;
  const unavailable = disabled || loading;
  const content = <>{loading && <span className="button-spinner" aria-hidden="true" />}{children}</>;
  // Disabled navigation renders a native disabled button, never an actionable link.
  if (to && !unavailable) return <Link to={to} className={classes} {...props}>{content}</Link>;
  if (href && !unavailable) return <a href={href} className={classes} {...props}>{content}</a>;
  return <button type="button" className={classes} {...props} disabled={unavailable} aria-busy={loading || undefined}>{content}</button>;
}
export function PrimaryButton(props) { return <Button {...props} variant="primary" />; }
export function SecondaryButton(props) { return <Button {...props} variant="secondary" />; }
export function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={'icon-button ' + className} aria-label={label} title={label} {...props}>{children}</button>;
}

