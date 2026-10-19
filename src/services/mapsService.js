export const mapsConfigured=!!import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
let loading;
export function loadMaps(){
 if(!mapsConfigured)return Promise.reject(new Error('Maps is not configured. Enter your address manually.'));
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(!loading)loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');const callback='virasatMapsReady';
  const timer=setTimeout(()=>fail(),20000);
  function fail(){clearTimeout(timer);script.remove();delete window[callback];loading=null;reject(new Error('Maps could not load. Please use manual address entry.'));}
  window[callback]=()=>{clearTimeout(timer);delete window[callback];resolve(window.google.maps);};
  const query=new URLSearchParams({key:import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY,v:'weekly',loading:'async',libraries:'places',callback});
  script.src='https://maps.googleapis.com/maps/api/js?'+query;script.async=true;script.onerror=fail;document.head.appendChild(script);
 });return loading;
}
export function coordinates(latitude,longitude){return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180;}
export function placeAddress(components=[]){
 const get=type=>components.find(c=>c.types?.includes(type))?.longText||'';
 const result={};for(const [key,value] of Object.entries({locality:get('sublocality_level_1')||get('sublocality'),city:get('locality')||get('administrative_area_level_2'),state:get('administrative_area_level_1'),postalCode:get('postal_code')}))if(value)result[key]=value;
 return result;
}
