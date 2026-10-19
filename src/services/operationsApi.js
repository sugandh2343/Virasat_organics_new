import {adminRequest,mutate} from './catalogueApi';
export const operationRead=(path,filters={})=>adminRequest('/admin/'+path+'?'+new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==''&&v!=null)));
export const operationWrite=(path,body,version,{method='POST',key}={})=>mutate('/admin/'+path,{method,body,version,idempotencyKey:key});
export async function exportReport(kind,filters){const {data}=await operationRead('reports/'+kind,{...filters,export:'csv'});const url=URL.createObjectURL(new Blob(['\ufeff',data.csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=data.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
