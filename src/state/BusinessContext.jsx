import {useSEO} from '../hooks/useSEO';
import { createContext, useContext,useEffect } from 'react';
import { business as fallbackBusiness } from '../mock-data/business';
import { getBusinessSettings } from '../services/contentService';
import { useAsyncData } from '../hooks/useAsyncData';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
export const BusinessContext=createContext(fallbackBusiness);
export function BusinessProvider({children}) {
  const {data,loading,error,retry}=useAsyncData(getBusinessSettings);
  useSEO(data?.seo,false,0);
  if(loading) return <LoadingState />;
  if(error) return <ErrorState retry={retry} />;
  return <BusinessContext.Provider value={data}>{children}</BusinessContext.Provider>;
}
export const useBusiness=()=>useContext(BusinessContext);
