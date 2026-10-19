import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton,SecondaryButton } from '../ui';
import { useStorefront } from '../../state/StorefrontContext';
import { authContent } from '../../mock-data/auth';
import { beginOtpPreview,checkOtpFormat,normalizeMobile,validateProfile,safeReturnPath } from '../../services/authService';
import FirebaseAuthFlow from './FirebaseAuthFlow';
export default function AuthFlow(props){const {customer}=useStorefront();return customer.enabled?<FirebaseAuthFlow {...props}/>:<DemoAuthFlow {...props}/>;}
function DemoAuthFlow({onClose,returnTo='/account'}){
 const {dispatch}=useStorefront();
 const navigate=useNavigate(); const id=useId();
 const [step,setStep]=useState('mobile');
 const [mobile,setMobile]=useState('');
 const [code,setCode]=useState('');
 const [name,setName]=useState('');
 const [email,setEmail]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [remaining,setRemaining]=useState(0);
 const [deadline,setDeadline]=useState(0);
 const field=useRef(null);
 useEffect(()=>{field.current?.focus();},[step]);
 useEffect(()=>{if(!deadline)return;const tick=()=>setRemaining(Math.max(0,Math.ceil((deadline-Date.now())/1000)));tick();const timer=setInterval(tick,1000);return ()=>clearInterval(timer);},[deadline]);
 const resetTimer=()=>{setRemaining(authContent.resendSeconds);setDeadline(Date.now()+authContent.resendSeconds*1000);};
 async function start(event){event?.preventDefault();setBusy(true);try{const result=await beginOtpPreview(mobile);setMobile(result.mobile);setCode('');setMessage(result.message);setStep('otp');resetTimer();}catch(error){setMessage(error.message);}finally{setBusy(false);}}
 async function check(event){event.preventDefault();setBusy(true);try{setMessage((await checkOtpFormat(code)).message);}finally{setBusy(false);}}
 function finish(withProfile=false){
  if(withProfile){const error=validateProfile({name,email,mobile});if(error){setMessage(error);return;}}
  dispatch({type:'session/demo',profile:{mobile,name:withProfile?name:'',email:withProfile?email:''}});
  onClose?.();navigate(safeReturnPath(returnTo),{replace:true});
 }
 return <div className="auth-flow"><p className="auth-demo-label">{authContent.disclosure}</p><p className="auth-notice">{authContent.notice}</p>
 <h2>{step==='mobile'?'Welcome to Virasat.':step==='otp'?'Explore the code-entry preview.':'Make this demo your own.'}</h2>
 {step==='mobile'?<form onSubmit={start} noValidate><label htmlFor={id+'-mobile'}>Mobile number</label><div className="auth-phone"><span>+91</span><input ref={field} id={id+'-mobile'} type="tel" inputMode="tel" autoComplete="tel-national" value={mobile} onChange={event=>{setMobile(event.target.value);setMessage('');}} onBlur={()=>setMobile(normalizeMobile(mobile))} placeholder="10-digit mobile number" aria-describedby={id+'-feedback'} maxLength={24}/></div><PrimaryButton type="submit" loading={busy}>Continue</PrimaryButton></form>:step==='otp'?<><p>Unverified demo number: +91 {mobile}</p><form onSubmit={check} noValidate><label htmlFor={id+'-otp'}>Six-digit demo code</label><input ref={field} className="auth-otp" id={id+'-otp'} inputMode="numeric" autoComplete="off" maxLength={6} value={code} onChange={event=>{setCode(event.target.value.replace(/\D/g,'').slice(0,6));setMessage('');}} aria-describedby={id+'-feedback'} placeholder="— — — — — —"/><SecondaryButton type="submit" loading={busy}>Check input format only</SecondaryButton></form>
 <div className="auth-secondary"><button type="button" disabled={remaining>0||busy} onClick={start}>{remaining>0?'Resend demo preview in '+remaining+'s':'Resend demo preview'}</button><button type="button" onClick={()=>{setStep('mobile');setCode('');setMessage('');}}>Change mobile number</button></div>
 <PrimaryButton onClick={()=>finish()}>Continue as Demo Customer</PrimaryButton><SecondaryButton onClick={()=>{setStep('profile');setMessage('');}}>Add optional demo profile</SecondaryButton></>:<form onSubmit={event=>{event.preventDefault();finish(true);}} noValidate><label htmlFor={id+'-name'}>Full name</label><input ref={field} id={id+'-name'} autoComplete="off" maxLength={80} value={name} onChange={event=>setName(event.target.value)} aria-describedby={id+'-feedback'}/><label htmlFor={id+'-profile-mobile'}>Mobile number · unverified</label><input id={id+'-profile-mobile'} value={'+91 '+mobile} readOnly/><label htmlFor={id+'-email'}>Email (optional)</label><input id={id+'-email'} type="email" autoComplete="off" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} aria-describedby={id+'-feedback'}/><PrimaryButton type="submit">Continue as Demo Customer</PrimaryButton><SecondaryButton onClick={()=>{setStep('otp');setMessage('');}}>Back to demo preview</SecondaryButton></form>}
 <p id={id+'-feedback'} className="auth-feedback" role="status">{message}</p><p className="quiet-note">{authContent.sessionNotice}</p>
 {step==='mobile'&&<SecondaryButton onClick={()=>onClose?onClose():navigate('/shop')}>Back to shopping</SecondaryButton>}
 </div>;
}

