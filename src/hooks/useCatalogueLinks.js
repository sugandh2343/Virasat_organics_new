import { getCategories } from '../services/contentService';
import { useAsyncData } from './useAsyncData';
export function useCatalogueLinks(){
 const {data}=useAsyncData(getCategories);
 return [{path:'/shop',label:'All Products'},...(data || []).map(category=>({path:'/shop/category/'+category.slug,label:category.name}))];
}
