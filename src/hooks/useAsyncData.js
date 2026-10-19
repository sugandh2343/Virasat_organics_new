import { subscribeMock } from '../services/mockStore';
import { useCallback, useEffect, useState } from 'react';
// Pass a stable service function or useCallback. Stale completions cannot overwrite newer requests.
export function useAsyncData(loader) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({loader:null, data:null, error:null, loading:true});
  useEffect(() => {
    let current = true;
    setState(previous=>previous.loader===loader && previous.data!==null ? {...previous,error:null,loading:false} : {loader,data:null,error:null,loading:true});
    Promise.resolve().then(loader).then(data => {if(current) setState({loader,data,error:null,loading:false});})
      .catch(error => {if(current) setState({loader,data:null,error,loading:false});});
    return () => {current = false;};
  }, [loader, attempt]);
  useEffect(()=>subscribeMock(()=>setAttempt(value=>value+1)),[]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return {...state, loading: state.loader !== loader || state.loading, retry};
}


