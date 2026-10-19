export function queryAdminRows(rows,{query='',status='All',sortKey='name',direction='asc',page=1,pageSize=10,searchKeys=['name','title','id','sku']}={}) {
 const term=query.trim().toLowerCase();
 const filtered=rows.filter(row=>(status==='All'||row.status===status)&&(!term||searchKeys.some(key=>String(row[key]??'').toLowerCase().includes(term))));
 const sorted=[...filtered].sort((a,b)=>{
  const av=a[sortKey],bv=b[sortKey];
  if(av==null && bv==null)return 0;if(av==null)return 1;if(bv==null)return -1;
  const result=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'en',{numeric:true,sensitivity:'base'});
  return direction==='desc'?-result:result;
 });
 const size=Number.isInteger(pageSize)&&pageSize>0?Math.min(pageSize,100):10;
 const pages=Math.max(1,Math.ceil(sorted.length/size));
 const current=Math.min(pages,Math.max(1,Number.isInteger(page)?page:1));
 return {rows:sorted.slice((current-1)*size,current*size),total:sorted.length,page:current,pages,pageSize:size};
}
