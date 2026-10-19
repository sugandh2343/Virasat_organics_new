import { useContext,useEffect } from 'react';
import { UNSAFE_DataRouterContext,useBlocker } from 'react-router-dom';
import { AdminConfirmDialog } from './AdminUI';
function RouterGuard({dirty}){
 const blocker=useBlocker(({currentLocation,nextLocation})=>dirty && currentLocation.pathname+currentLocation.search!==nextLocation.pathname+nextLocation.search);
 return <AdminConfirmDialog open={blocker.state==='blocked'} onClose={()=>blocker.reset?.()} onConfirm={()=>blocker.proceed?.()} title="Discard unsaved changes?" description="Your unsaved form values will be lost. Previously saved local demo data is unchanged." confirmLabel="Discard and leave"/>;
}
export default function UnsavedGuard({dirty}){
 const router=useContext(UNSAFE_DataRouterContext);
 useEffect(()=>{const handler=event=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 return router?<RouterGuard dirty={dirty}/>:null;
}
