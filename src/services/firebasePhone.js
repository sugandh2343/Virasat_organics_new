import { isValidMobile, normalizeMobile } from './authService';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const firebaseConfigured=Object.values(config).every(v=>typeof v==='string'&&v.trim());
export function phoneSetupMessage(host=typeof location==='undefined'?'':location.hostname){
 if(!firebaseConfigured)return 'Firebase not configured. Customer SMS sign-in will be available after setup.';
 if(['localhost','127.0.0.1','::1','[::1]'].includes(host))return 'SMS sign-in requires an authorized HTTPS hosted domain. Use the configured staging site.';
 return '';
}
export const validOtp=code=>/^\d{6}$/.test(code);
export function firebaseMessage(error){
 const messages={'auth/invalid-verification-code':'That code is incorrect. Please try again.','auth/code-expired':'That code expired. Request a new code.','auth/session-expired':'That code expired. Request a new code.','auth/too-many-requests':'Too many attempts. Please wait before trying again.','auth/quota-exceeded':'SMS is temporarily unavailable. Try later.','auth/captcha-check-failed':'Please complete the security check again.','auth/invalid-app-credential':'Phone sign-in configuration needs attention.','auth/unauthorized-domain':'This domain is not authorized for phone sign-in.','auth/network-request-failed':'Connection failed. Check your connection and retry.','auth/invalid-phone-number':'Enter a valid Indian mobile number.'};
 return messages[error?.code]||'Phone verification could not be completed. Please try again.';
}
let sdkPromise;
async function sdk(){
 if(!firebaseConfigured)throw new Error(phoneSetupMessage());
 if(!sdkPromise)sdkPromise=Promise.all([import('firebase/app'),import('firebase/auth')]).then(async([app,auth])=>{
  const instance=app.getApps().find(a=>a.name==='virasat-customer')||app.initializeApp(config,'virasat-customer');
  const instanceAuth=auth.getAuth(instance);await auth.setPersistence(instanceAuth,auth.inMemoryPersistence);return {auth,instanceAuth};
 }).catch(error=>{sdkPromise=null;throw error;});return sdkPromise;
}
export async function signOutFirebase(){if(sdkPromise){const {auth,instanceAuth}=await sdkPromise;await auth.signOut(instanceAuth);}}
export function phoneChallenge(container){
 let verifier=null,confirmation=null,cancelled=false;
 return {
  async send(mobile){
   if(!isValidMobile(mobile))throw new Error('Enter a valid 10-digit Indian mobile number.');
   const message=phoneSetupMessage();if(message)throw new Error(message);
   const {auth,instanceAuth}=await sdk();if(cancelled)throw new Error('Sign-in closed.');
   verifier?.clear();confirmation=null;
   verifier=new auth.RecaptchaVerifier(instanceAuth,container,{size:'normal'});
   try{const result=await auth.signInWithPhoneNumber(instanceAuth,'+91'+normalizeMobile(mobile),verifier);if(cancelled)throw new Error('Sign-in closed.');confirmation=result;}
   catch(error){verifier?.clear();verifier=null;throw new Error(firebaseMessage(error));}
  },
  async verify(code){
   if(!validOtp(code))throw new Error('Enter exactly six digits.');
   if(!confirmation||cancelled)throw new Error('Request a new verification code.');
   try{const result=await confirmation.confirm(code);return await result.user.getIdToken(true);}catch(error){throw new Error(firebaseMessage(error));}
  },
  clear(){cancelled=true;confirmation=null;verifier?.clear();verifier=null;},
 };
}
