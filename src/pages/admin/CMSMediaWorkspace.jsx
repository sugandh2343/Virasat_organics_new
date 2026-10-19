import {all,rememberMedia} from '../../services/catalogueApi';
import {useAsyncData} from '../../hooks/useAsyncData';
import {ErrorState,LoadingState} from '../../components/ui/PageStates';
import CatalogueWorkspace from './CatalogueWorkspace';
const load=async()=>({media:await all('/admin/media',rememberMedia),products:[],categories:[],inventoryActivity:[]});
export default function CMSMediaWorkspace({route}){const {data,loading,error,retry}=useAsyncData(load);if(loading)return <LoadingState/>;if(error)return <ErrorState retry={retry}/>;return <CatalogueWorkspace route={route} data={data}/>;}
