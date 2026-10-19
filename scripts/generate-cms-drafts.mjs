import fs from 'node:fs';
import {homeContent} from '../src/mock-data/home.js';
const root=new URL('../',import.meta.url);
const h=structuredClone(homeContent);
fs.writeFileSync(new URL('backend/config/home-schema.json',root),JSON.stringify(h,null,2)+'\n');
const str=s=>"CONVERT(0x"+Buffer.from(s).toString('hex')+" USING utf8mb4)";
const groups={hero:['eyebrow','title','emphasis','description','action','secondaryAction','showcase','highlights'],story:['story'],values:['values'],journal:['journal'],testimonials:['testimonials'],newsletter:['newsletter']};
let sql='-- OPTIONAL reviewed draft initialization, after migration 006. No publications or existing row updates.\n';
for(const section of h.sections){const k=section.id;const content=groups[k]?Object.fromEntries(groups[k].map(key=>[key,h[key]])):['categories','collection'].includes(k)?{shopping:{[k]:h.shopping[k]}}:k==='introduction'?{video:h.video,media:{introduction:h.media.introduction}}:{media:{gallery:h.media.gallery}};
 sql+=`INSERT INTO homepage_sections(id,section_key,enabled,sort_order,content) SELECT 'home-${k}','${k}',${section.enabled?1:0},${section.order},${str(JSON.stringify(content))} WHERE NOT EXISTS (SELECT 1 FROM homepage_sections WHERE section_key='${k}');\n`;
}
sql+="INSERT INTO business_settings(id,name) SELECT 'business-virasat','Virasat Organics' WHERE NOT EXISTS(SELECT 1 FROM business_settings WHERE id='business-virasat');\nINSERT INTO compliance_settings(id) SELECT 'compliance-settings' WHERE NOT EXISTS(SELECT 1 FROM compliance_settings WHERE id='compliance-settings');\n";
for(const [slug,title] of Object.entries({'our-story':'Our Story',about:'About',contact:'Contact','privacy-policy':'Privacy Policy','terms-and-conditions':'Terms and Conditions','shipping-policy':'Shipping Policy','returns-refunds':'Returns and Refunds',faq:'FAQ'}))sql+=`INSERT INTO cms_pages(id,slug,title,blocks,status,is_core_seed) SELECT 'page-${slug}','${slug}','${title}','[]','draft',1 WHERE NOT EXISTS(SELECT 1 FROM cms_pages WHERE slug='${slug}');\n`;
fs.writeFileSync(new URL('backend/database/manual/initialize_cms_drafts.sql',root),sql);
console.log('Generated schema and nonpublishing draft initialization from existing homepage. No database used.');
