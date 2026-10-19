import '../../styles/admin-inline-media.css';
import {useRef,useState,useSyncExternalStore} from 'react';
import {apiMode,upload,subscribeAdminAuth} from '../../services/catalogueApi';
import {CatalogueField} from './CatalogueFields';
import ResponsiveImage from '../ui/ResponsiveImage';
let uploaded=[];const listeners=new Set();
const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
const snapshot=()=>uploaded;
subscribeAdminAuth(()=>{uploaded=[];listeners.forEach(fn=>fn());});
export function useInlineMedia(media=[]){const recent=useSyncExternalStore(subscribe,snapshot,snapshot);return [...new Map([...media,...recent].map(item=>[item.id,item])).values()];}
export function validateInlineFile(file,kind){
 const types=kind==='video'?['video/mp4']:['image/jpeg','image/png','image/webp'];
 if(!types.includes(file.type))throw new Error(kind==='video'?'Choose an MP4 video.':'Choose a JPEG, PNG or WebP image.');
 if(file.size===0||file.size>(kind==='video'?100:10)*1024*1024)throw new Error(kind==='video'?'Video must be non-empty and at most 100 MB.':'Image must be non-empty and at most 10 MB.');
}
export function InlineUpload({kind='image',label='Image',onUploaded}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');const lock=useRef(false),latest=useRef(onUploaded);latest.current=onUploaded;
 async function select(event){const input=event.currentTarget,file=input.files?.[0];if(!file||lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
 try{validateInlineFile(file,kind);const rows=await upload([file],{notify:false});const item=rows[0];if(!item?.id||item.kind!==kind)throw new Error('Upload response did not contain the expected media. Reload the media library before retrying.');uploaded=[...uploaded.filter(v=>v.id!==item.id),item];listeners.forEach(fn=>fn());latest.current(item);setMessage('Uploaded and selected in this draft. Save'+(kind==='image'?' or publish':'')+' to apply it.');}
 catch(e){setError(e.message||'Upload failed. Your previous selection is unchanged.');}finally{lock.current=false;setBusy(false);input.value='';}}
 return <div className="inline-media-upload">{apiMode?<><label>Upload {label.toLowerCase()} from computer<input type="file" accept={kind==='video'?'video/mp4':'image/jpeg,image/png,image/webp'} disabled={busy} onChange={select}/></label><small>{kind==='video'?'MP4 · up to 100 MB':'JPEG, PNG or WebP · up to 10 MB'}. Selecting a file uploads it to your private media library; it does not publish this draft.</small></>:<p>Local mock preview: use the Media Library to select temporary files.</p>}{(busy||message)&&<p role="status">{busy?'Uploading… Keep this editor open.':message}</p>}{error&&<p role="alert">{error}</p>}</div>;
}
export default function InlineMediaPicker({label,kind='image',value,onChange,media=[],error}){
 const library=useInlineMedia(media),selected=library.find(item=>item.id===value);
 return <div><CatalogueField label={label} value={value||''} error={error} onChange={id=>onChange(id||null)}><option value="">No media / placeholder</option>{library.filter(item=>item.kind===kind).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</CatalogueField><InlineUpload label={label} kind={kind} onUploaded={item=>onChange(item.id)}/>{selected?.src&&(kind==='image'?<ResponsiveImage src={selected.src} alt={selected.alt||label} aspectRatio="3 / 2"/>:<video src={selected.src} controls preload="metadata" style={{width:'100%'}}/>)}</div>;
}
