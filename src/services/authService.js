export function normalizeMobile(value=''){
 const compact=String(value).trim().replace(/[\s()-]/g,'');
 return compact.startsWith('+91')?compact.slice(3):compact.length===12&&compact.startsWith('91')?compact.slice(2):compact;
}
export const isValidMobile=value=>/^[6-9][0-9]{9}$/.test(normalizeMobile(value));
export function validateProfile({name='',email='',mobile=''}){
 if(!isValidMobile(mobile))return 'Enter a valid 10-digit Indian mobile number.';
 if(!name.trim() || name.trim().length>80)return 'Enter your full name (up to 80 characters).';
 if(email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length>254))return 'Enter a valid email address or leave it blank.';
 return null;
}
export const otpFormatMessage=code=>/^\d{6}$/.test(code)?'Six-digit format entered. This prototype cannot verify a code or phone ownership.':'Enter exactly six digits to preview the code format.';
export async function beginOtpPreview(mobile){
 if(!isValidMobile(mobile))throw new Error('Enter a valid 10-digit Indian mobile number.');
 return {mobile:normalizeMobile(mobile),mode:'demo',message:'Demo code-entry screen ready. No SMS was sent.'};
}
export async function checkOtpFormat(code){return {verified:false,message:otpFormatMessage(code)};}
export function createDemoSession(profile={}){
 return {instanceId:crypto.randomUUID(),addresses:[],deliveryAddressId:null,mode:'demo',customerId:'demo-customer',verified:false,profile:{name:typeof profile.name==='string'?profile.name.trim().slice(0,80):'',mobile:isValidMobile(profile.mobile)?normalizeMobile(profile.mobile):'',email:typeof profile.email==='string'?profile.email.trim().slice(0,254):''}};
}
export function safeReturnPath(value){return /^\/account(?:\/(?:profile|addresses|orders)(?:\/[a-zA-Z0-9_-]+)?)?$/.test(value||'') || value==='/checkout'?value:'/account';}

