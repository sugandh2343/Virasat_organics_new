import '../../styles/catalogue-admin.css';
import {useEffect,useState,useRef} from 'react';
import {Navigate,useLocation,useNavigate} from 'react-router-dom';
import {PrimaryButton,SecondaryButton} from '../ui';
import {adminSession,adminLogin,subscribeAdminAuth} from '../../services/catalogueApi';
export function adminReturnPath(value){return typeof value==='string'&&/^\/admin(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(value)&&!value.startsWith('/admin/login')?value:'/admin';}
export default function AdminApiGate({children}){
 const location=useLocation(),navigate=useNavigate();
 const [session,setSession]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0);
 const isLogin=location.pathname==='/admin/login';
 const returnTo=adminReturnPath(new URLSearchParams(location.search).get('returnTo'));
 const load=async(initial=false)=>{
  const current=++generation.current;if(initial)setLoading(true);
  try{const result=await adminSession();if(current===generation.current){setSession(result);setError('');}}
  catch(e){if(current===generation.current){setSession(null);setError(e.message+(e.requestId?' Reference: '+e.requestId:''));}}
  finally{if(current===generation.current)setLoading(false);}
 };
 useEffect(()=>{
  load(true);
  const unsubscribe=subscribeAdminAuth(()=>{generation.current++;setSession(null);setLoading(false);setError('Your session is no longer valid. Sign in again.');});
  const focus=()=>load();window.addEventListener('focus',focus);
  return()=>{generation.current++;unsubscribe();window.removeEventListener('focus',focus);};
 },[]);
 if(loading)return <main className="container section"><p role="status">Checking administrator session…</p></main>;
 if(!isLogin&&!session?.admin)return <Navigate to={'/admin/login?returnTo='+encodeURIComponent(adminReturnPath(location.pathname))} replace/>;
 if(session?.admin)return isLogin?<Navigate to={returnTo} replace/>:children;
 return <main className="container section"><h1>Administrator sign in</h1><p>Secure catalogue access. Customer demo accounts cannot sign in here.</p><form className="catalogue-form" onSubmit={async e=>{
  e.preventDefault();if(busy)return;setBusy(true);setError('');
  const form=e.currentTarget;const values=new FormData(form);let password=values.get('password');const email=values.get('email');values.delete('password');
  try{const result=await adminLogin(email,password);if(!result.admin)throw new Error('The server did not establish an administrator session.');generation.current++;setSession(result);navigate(returnTo,{replace:true});}
  catch(e){setSession(null);setError(e.message+(e.requestId?' Reference: '+e.requestId:''));}
  finally{password=null;form.elements.namedItem('password').value='';setBusy(false);}
 }}><label>Email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={72}/></label><p role="alert">{error}</p><PrimaryButton type="submit" loading={busy}>Sign in</PrimaryButton><SecondaryButton disabled={busy} onClick={()=>load(true)}>Retry connection</SecondaryButton></form></main>;
}

