import { useEffect,useRef,useState,useId } from 'react';
import { PrimaryButton,SecondaryButton } from '../ui';
import { mapsConfigured,loadMaps,placeAddress,coordinates } from '../../services/mapsService';
export default function RealLocationSelector({onSelect,initialPin=''}){
 const [pin,setPin]=useState(initialPin),[message,setMessage]=useState(''),[selected,setSelected]=useState(null),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false);
 const widget=useRef(null),canvas=useRef(null),map=useRef(null),circle=useRef(null),clickListener=useRef(null),alive=useRef(true);const id=useId();
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clickListener.current?.remove();circle.current?.setMap(null);};},[]);
 useEffect(()=>{
  if(!enabled)return;let disposed=false,element,listener;
  loadMaps().then(async maps=>{
   const {PlaceAutocompleteElement}=await maps.importLibrary('places');if(disposed)return;
   element=new PlaceAutocompleteElement({includedRegionCodes:['in']});element.setAttribute('aria-label','Search address, locality or city');widget.current.appendChild(element);
   listener=async event=>{try{const place=event.placePrediction.toPlace();await place.fetchFields({fields:['location','addressComponents']});if(disposed)return;const lat=place.location?.lat(),lng=place.location?.lng();if(!coordinates(lat,lng))throw new Error('No map location was returned.');const address=placeAddress(place.addressComponents);setSelected({...address,latitude:lat,longitude:lng});if(address.postalCode)setPin(address.postalCode);setMessage('Review the address and map position, then confirm.');}catch{if(!disposed)setMessage('Place details could not load. Enter your address manually.');}};
   element.addEventListener('gmp-select',listener);
  }).catch(e=>{if(!disposed)setMessage(e.message);});
  return()=>{disposed=true;if(element){element.removeEventListener('gmp-select',listener);element.remove();}};
 },[enabled]);
 useEffect(()=>{
  if(!selected||!mapsConfigured)return;let disposed=false;
  loadMaps().then(async maps=>{await maps.importLibrary('maps');if(disposed||!canvas.current)return;const center={lat:selected.latitude,lng:selected.longitude};
   if(!map.current){map.current=new maps.Map(canvas.current,{center,zoom:17,mapTypeControl:false,streetViewControl:false});clickListener.current=map.current.addListener('click',event=>{const latitude=event.latLng.lat(),longitude=event.latLng.lng();setSelected(previous=>({...previous,latitude,longitude}));setMessage('Pin moved. Review the address text separately, then confirm the location.');});circle.current=new maps.Circle({map:map.current,center,radius:12,fillColor:'#183D2B',fillOpacity:0.8,strokeColor:'#B29A66',clickable:false});}
   else{map.current.setCenter(center);circle.current.setCenter(center);}
  }).catch(e=>{if(!disposed)setMessage(e.message);});return()=>{disposed=true;};
 },[selected]);
 function locate(){if(!navigator.geolocation){setMessage('Geolocation is unavailable. Enter your address manually.');return;}setBusy(true);navigator.geolocation.getCurrentPosition(position=>{if(!alive.current)return;setBusy(false);const {latitude,longitude}=position.coords;if(!coordinates(latitude,longitude)){setMessage('A valid location was not returned.');return;}setSelected({latitude,longitude});setMessage('Location captured. Enter or check the address and PIN, then confirm.');},()=>{if(alive.current){setBusy(false);setMessage('Location was unavailable or permission was denied. Manual entry remains available.');}},{enableHighAccuracy:false,timeout:12000,maximumAge:0});}
 return <div className="location-selector"><p>Choose a location or enter a PIN manually. This does not confirm delivery availability.</p>
 <label htmlFor={id}>PIN code</label><input id={id} value={pin} maxLength={6} inputMode="numeric" onChange={e=>setPin(e.target.value)}/><PrimaryButton onClick={()=>{if(!/^[1-9]\d{5}$/.test(pin)){setMessage('Enter a valid six-digit Indian PIN.');return;}onSelect({postalCode:pin});}}>Use this PIN</PrimaryButton>
 {mapsConfigured?<SecondaryButton disabled={enabled} onClick={()=>setEnabled(true)}>Search address on Google Maps</SecondaryButton>:<p>Maps is not configured. Manual address entry remains available.</p>}<div ref={widget}/>
 <SecondaryButton loading={busy} onClick={locate}>Use current location</SecondaryButton>
 {selected&&<><div ref={canvas} style={{height:mapsConfigured?'240px':0,width:'100%'}} aria-label="Choose a map position"/><p>Selected coordinates: {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}. {mapsConfigured?'Click the map to adjust the pin.':''}</p><SecondaryButton onClick={()=>{onSelect({...selected,...(/^[1-9]\d{5}$/.test(pin)?{postalCode:pin}:{}),coordinatesConfirmed:true});}}>Confirm this location</SecondaryButton></>}
 <p role="status">{message}</p></div>;
}
