import { useEffect,useRef,useState,useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton,SecondaryButton } from '../ui';
import { useStorefront } from '../../state/StorefrontContext';
import { phoneChallenge,phoneSetupMessage,validOtp,signOutFirebase } from '../../services/firebasePhone';
import { normalizeMobile,safeReturnPath } from '../../services/authService';
export default function FirebaseAuthFlow({onClose,returnTo='/account'}){
 const {customer}=useStorefront();const navigate=useNavigate();const id=useId();
 const [phone,setPhone]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[deadline,setDeadline]=useState(0),[remaining,setRemaining]=useState(0);
 const container=useRef(null),challenge=useRef(null),mounted=useRef(true);const setup=phoneSetupMessage();
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;challenge.current?.clear();};},[]);
 useEffect(()=>{const tick=()=>setRemaining(Math.max(0,Math.ceil((deadline-Date.now())/1000)));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[deadline]);
 async function send(e){e?.preventDefault();if(busy||remaining)return;setBusy(true);setMessage('');try{challenge.current?.clear();challenge.current=phoneChallenge(container.current);await challenge.current.send(phone);if(mounted.current){setPhone(normalizeMobile(phone));setSent(true);setCode('');setDeadline(Date.now()+60000);setMessage('Code sent. Check your SMS.');}}catch(e){if(mounted.current){setMessage(e.message);setDeadline(Date.now()+30000);}}finally{if(mounted.current)setBusy(false);}}
 async function verify(e){e.preventDefault();if(!validOtp(code)){setMessage('Enter exactly six digits.');return;}setBusy(true);setMessage('');let token;
  try{token=await challenge.current.verify(code);if(!mounted.current)return;await customer.login(token);if(mounted.current){onClose?.();navigate(safeReturnPath(returnTo),{replace:true});}}
  catch(e){if(mounted.current)setMessage(e.message);}finally{token=null;await signOutFirebase().catch(()=>{});if(mounted.current){setCode('');setBusy(false);}}
 }
 return <div className="auth-flow"><h2>Welcome to Virasat.</h2><p>Sign in securely with your mobile number.</p>{setup&&<p role="status">{setup}</p>}
 <p className="quiet-note">By requesting a code, you agree to receive a verification SMS. Google processes your number for authentication and abuse prevention.</p>
 {!sent?<form onSubmit={send}><label htmlFor={id+'phone'}>Mobile number</label><div className="auth-phone"><span>+91</span><input id={id+'phone'} type="tel" autoComplete="tel-national" value={phone} maxLength={24} onChange={e=>setPhone(e.target.value)} /></div><PrimaryButton type="submit" disabled={!!setup||remaining>0} loading={busy}>{remaining?`Try again in ${remaining}s`:'Send verification code'}</PrimaryButton></form>:<><p>Code sent to +91 {phone}</p><form onSubmit={verify}><label htmlFor={id+'code'}>Six-digit verification code</label><input id={id+'code'} className="auth-otp" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}/><PrimaryButton type="submit" loading={busy}>Verify and sign in</PrimaryButton></form><div className="auth-secondary"><button disabled={busy||remaining>0} onClick={send}>{remaining?`Resend in ${remaining}s`:'Resend code'}</button><button disabled={busy} onClick={()=>{challenge.current?.clear();setSent(false);setCode('');setMessage('');}}>Change mobile number</button></div></>}
 <div ref={container}/><p role="status">{message||customer.error}</p><SecondaryButton onClick={()=>onClose?onClose():navigate('/shop')}>Back to shopping</SecondaryButton></div>;
}
