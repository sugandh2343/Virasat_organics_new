const urls=new Set();
export function createPreviewURL(file){const url=URL.createObjectURL(file);urls.add(url);return url;}
export function releasePreviewURL(url){if(urls.delete(url))URL.revokeObjectURL(url);}
export function releaseAllPreviewURLs(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();}
if(typeof window!=='undefined')window.addEventListener('pagehide',event=>{if(!event.persisted)releaseAllPreviewURLs();});
