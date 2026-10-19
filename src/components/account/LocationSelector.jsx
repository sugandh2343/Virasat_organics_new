import { useId,useState } from 'react';
import { ModalShell,PrimaryButton,SecondaryButton } from '../ui';
import { isValidPin,normalizePin } from '../../services/deliveryService';
import { demoLocations,locationCopy } from '../../mock-data/account';
import { useStorefront } from '../../state/StorefrontContext';
import RealLocationSelector from './RealLocationSelector';
export function LocationSelector(props){const {customer}=useStorefront();return customer.enabled?<RealLocationSelector {...props}/>:<DemoLocationSelector {...props}/>;}
function DemoLocationSelector({onSelect,initialPin='',embedded=false}){
 const Tag=embedded?'div':'form'; const id=useId();const [pin,setPin]=useState(initialPin);const [query,setQuery]=useState('');const [message,setMessage]=useState('');
 const results=query.trim()?demoLocations.filter(item=>item.city.toLowerCase().includes(query.trim().toLowerCase())||item.state.toLowerCase().includes(query.trim().toLowerCase())):[];
 return <div className="location-selector"><p className="auth-demo-label">DEMO LOCATION PREVIEW</p><p>{locationCopy.notice}</p><Tag className="location-pin-entry" onSubmit={event=>{event.preventDefault();if(!isValidPin(pin)){setMessage('Enter a valid six-digit Indian PIN.');return;}onSelect({postalCode:normalizePin(pin)});}} noValidate><label htmlFor={id+'pin'}>Enter PIN code</label><input id={id+'pin'} inputMode="numeric" maxLength={6} value={pin} onChange={event=>setPin(event.target.value)} aria-describedby={id+'message'}/><PrimaryButton type={embedded?'button':'submit'} onClick={embedded?()=>{if(!isValidPin(pin)){setMessage('Enter a valid six-digit Indian PIN.');return;}onSelect({postalCode:normalizePin(pin)});}:undefined}>Use this PIN</PrimaryButton></Tag>
 <label htmlFor={id+'city'}>Search demo locality / city suggestions</label><input id={id+'city'} value={query} onChange={event=>setQuery(event.target.value)} autoComplete="off"/><ul>{results.map(item=><li key={item.id}><button type="button" onClick={()=>{onSelect({city:item.city,state:item.state,demoSuggestion:true});setMessage('Demo city selected. Enter a PIN separately; delivery coverage is not confirmed.');}}>{item.label}</button></li>)}</ul>{query.trim()&&!results.length&&<p>No matching demo suggestions.</p>}
 <SecondaryButton onClick={()=>setMessage(locationCopy.gps)}>Use current location</SecondaryButton><p id={id+'message'} role="status">{message}</p></div>;
}
export default function LocationOverlay(){
 const {state,dispatch}=useStorefront();
 const close=()=>dispatch({type:'overlay/set',value:null});
 return <ModalShell open={state.overlay==='location'} onClose={close} title="Choose a delivery location" className="location-modal">{state.overlay==='location'&&<><LocationSelector initialPin={state.location?.postalCode||''} onSelect={value=>{if(value.postalCode){dispatch({type:'location/set',value});close();}}}/>{state.location&&<SecondaryButton onClick={()=>{dispatch({type:'location/set',value:null});close();}}>Clear selected PIN</SecondaryButton>}</>}</ModalShell>;
}

