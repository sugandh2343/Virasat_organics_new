<?php
declare(strict_types=1);
namespace Virasat;
final class CMSService {
 private CatalogueRepository $r;private string $actor;private string $requestId;private CommerceService $tx;
 public function __construct(CatalogueRepository $r,string $actor='',string $requestId='cms'){$this->r=$r;$this->actor=$actor;$this->requestId=$requestId;$this->tx=new CommerceService($r,[]);}
 private function json($v){return json_decode($v??'null',true,64,JSON_THROW_ON_ERROR);}
 private function audit(string $action,string $table,string $id):void{$this->r->audit($this->actor,$action,$table,$id,$this->requestId);}
 private function medium($id,string $kind='image',bool $lock=false):?array{if(!$id)return null;$v=$this->r->one("SELECT * FROM media_assets WHERE id=? AND kind=? AND status='ready'".($lock?' FOR UPDATE':''),[CommerceRules::id($id),$kind]);return CatalogueRepository::media($v);}
 public function resolve($v){if(!is_array($v))return $v;$out=[];foreach($v as $k=>$x)$out[$k]=$this->resolve($x);if(!empty($v['mediaId'])){$m=$this->r->query("SELECT * FROM media_assets WHERE id=? AND status='ready'",[$v['mediaId']])->fetch();$out['src']=$m?'/api/media/'.$m['id']:null;}if(!empty($v['posterMediaId']))$out['poster']='/api/media/'.$v['posterMediaId'];return $out;}
 private function references($v,string $ownerColumn,string $owner,string $prefix='',bool $insert=true):void{
  if(!is_array($v))return;
  foreach($v as $k=>$x){$path=$prefix===''?(string)$k:$prefix.'.'.$k;if(in_array($k,['mediaId','posterMediaId'],true)&&$x){$kind=$k==='mediaId'&&(substr($prefix,-5)==='video')?'video':'image';$this->medium($x,$kind,true);if($insert)$this->r->insert('media_references',['id'=>CatalogueRepository::id(),'media_asset_id'=>$x,$ownerColumn=>$owner,'field_path'=>$path]);}else $this->references($x,$ownerColumn,$owner,$path,$insert);}
 }
 public function homepage(bool $admin=false):array{
  $rows=$this->r->query('SELECT * FROM homepage_sections ORDER BY sort_order,id')->fetchAll();$out=['id'=>'homepage-main','slug'=>'home','sections'=>[]];$version=1;$published=null;
  foreach($rows as $row){$version=max($version,(int)$row['version']);if($admin){$content=$this->json($row['content']);$enabled=(bool)$row['enabled'];$order=(int)$row['sort_order'];}else{$p=$this->json($row['published_content']);if(!$p)continue;$content=$p['content'];$enabled=$p['enabled'];$order=$p['order'];}if($admin||$enabled)$out=array_replace_recursive($out,$content);$out['sections'][]=['id'=>$row['section_key'],'order'=>$order,'enabled'=>$enabled];$published=$row['published_at']??$published;}
  if(count($out['sections'])!==10)throw new HttpError(404,'CONTENT_UNPUBLISHED','Homepage content has not been published.');
  $out['version']=$version;$out['publishedAt']=$published;return $admin?$out:$this->resolve($out);
 }
 public function saveHome(array $body,Request $request):array{
  Request::allowFields($body,['content','publish']);$h=CMSRules::home($body['content']??[]);$publish=CMSRules::bool($body['publish']??false);
  return $this->tx->transaction(function()use($h,$publish,$request){
   $rows=$this->r->query('SELECT * FROM homepage_sections ORDER BY id FOR UPDATE')->fetchAll();if(count($rows)!==10)throw new HttpError(409,'CMS_NOT_INITIALIZED','Import the reviewed CMS draft seed first.');$version=max(array_column($rows,'version'));CustomerSecurity::version($request,['version'=>$version]);
   // Temporarily shift positions to avoid MySQL unique sort_order collisions during swaps.
   $this->r->query('UPDATE homepage_sections SET sort_order=sort_order+100');
   foreach($rows as $row){$section=array_values(array_filter($h['sections'],fn($s)=>$s['id']===$row['section_key']))[0];$fragment=CMSRules::fragment($h,$row['section_key']);$values=['content'=>json_encode($fragment,JSON_THROW_ON_ERROR),'enabled'=>$section['enabled']?1:0,'sort_order'=>$section['order']];$published=$this->json($row['published_content']);if($publish){$published=['content'=>$fragment,'enabled'=>$section['enabled'],'order'=>$section['order']];$values['published_content']=json_encode($published,JSON_THROW_ON_ERROR);$values['published_at']=gmdate('Y-m-d H:i:s');}$this->r->update('homepage_sections',$row['id'],$values);$this->r->query('DELETE FROM media_references WHERE homepage_section_id=?',[$row['id']]);$this->references($fragment,'homepage_section_id',$row['id'],'draft');if($published)$this->references($published['content'],'homepage_section_id',$row['id'],'published');}
   $this->audit($publish?'homepage.publish':'homepage.draft','homepage','homepage-main');return $this->homepage(true);
  });
 }
 private function table(string $kind):string{$map=['blog'=>'blog_posts','pages'=>'cms_pages','banners'=>'banners','blog-categories'=>'blog_categories'];if(!isset($map[$kind]))throw new HttpError(404,'NOT_FOUND','Unknown collection.');return $map[$kind];}
 public function record(string $kind,array $r,bool $admin=false):array{
  if($kind==='blog-categories')return ['id'=>$r['id'],'slug'=>$r['slug'],'name'=>$r['name'],'status'=>$r['status'],'version'=>(int)$r['version']];
  $v=['id'=>$r['id'],'title'=>$r['title'],'status'=>$r['status'],'version'=>(int)$r['version'],'updatedAt'=>CommerceRules::time($r['updated_at']),'publishedAt'=>$r['published_at']?CommerceRules::time($r['published_at']):null];
  if($kind==='banners')return $v+['name'=>$r['name']??'','description'=>$r['description']??'','alt'=>$r['alt'],'ctaLabel'=>$r['cta_label'],'destination'=>$r['cta_destination'],'sortOrder'=>(int)$r['sort_order'],'desktop'=>['mediaId'=>$r['desktop_media_asset_id'],'src'=>$r['desktop_media_asset_id']?'/api/media/'.$r['desktop_media_asset_id']:null],'mobile'=>['mediaId'=>$r['mobile_media_asset_id'],'src'=>$r['mobile_media_asset_id']?'/api/media/'.$r['mobile_media_asset_id']:null]];
  $v+=['slug'=>$r['slug'],'blocks'=>$this->json($r['blocks']),'seo'=>['title'=>$r['seo_title'],'description'=>$r['seo_description']]];
  if($kind==='blog'){$cat=$r['blog_category_id']?$this->r->query('SELECT name FROM blog_categories WHERE id=?',[$r['blog_category_id']])->fetchColumn():null;$v+=['categoryId'=>$r['blog_category_id'],'category'=>$cat?:'','excerpt'=>$r['excerpt'],'authorDisplay'=>$r['author_display']??'','image'=>['mediaId'=>$r['image_media_asset_id'],'src'=>$r['image_media_asset_id']?'/api/media/'.$r['image_media_asset_id']:null]];}
  else $v+=['description'=>$r['description'],'video'=>['mediaId'=>$r['video_media_asset_id'],'posterMediaId'=>$r['poster_media_asset_id'],'src'=>$r['video_media_asset_id']?'/api/media/'.$r['video_media_asset_id']:null,'poster'=>$r['poster_media_asset_id']?'/api/media/'.$r['poster_media_asset_id']:null]];
  return $admin?$v:$this->resolve($v);
 }
 public function list(string $kind,array $q=[],bool $admin=false):array{
  $table=$this->table($kind);Request::allowFields($q,['page','pageSize','q','status','category']);$page=filter_var($q['page']??1,FILTER_VALIDATE_INT);$size=filter_var($q['pageSize']??20,FILTER_VALIDATE_INT);if(!$page||$page<1||$page>100000||!$size||$size<1||$size>100)CatalogueRules::fail('Invalid pagination.');$where=$admin?'1=1':"status='".(in_array($kind,['banners','blog-categories'],true)?'active':'published')."'";$args=[];
  if(isset($q['status'])&&$admin){$where.=' AND status=?';$args[]=CMSRules::text($q['status'],32);}
  if(!empty($q['q'])){$where.=' AND '.($kind==='blog-categories'?'name':'title').' LIKE ?';$args[]='%'.CMSRules::text($q['q'],100).'%';}
  if(!empty($q['category'])&&$kind==='blog'){$where.=' AND blog_category_id=?';$args[]=CommerceRules::id($q['category']);}
  $total=(int)$this->r->query('SELECT COUNT(*) FROM '.$table.' WHERE '.$where,$args)->fetchColumn();$sort=$kind==='banners'?'sort_order,id':($kind==='blog'?'published_at DESC,id':'id');
  $rows=$this->r->query('SELECT * FROM '.$table.' WHERE '.$where.' ORDER BY '.$sort.' LIMIT '.$size.' OFFSET '.(($page-1)*$size),$args)->fetchAll();return ['data'=>array_map(fn($r)=>$this->record($kind,$r,$admin),$rows),'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total]];
 }
 public function get(string $kind,string $id,bool $admin=false):array{$table=$this->table($kind);$row=$this->r->one('SELECT * FROM '.$table.' WHERE '.($admin?'id':'slug').'=?'.($admin?'':" AND status='published'"),[$id]);return $this->record($kind,$row,$admin);}
 public function save(string $kind,array $v,?string $id,Request $request):array{
  $table=$this->table($kind);return $this->tx->transaction(function()use($kind,$table,$v,$id,$request){
   $create=$id===null;$key=null;$hash=null;$pathHash=hash('sha256','cms:'.$kind);
   if($create){$key=CommerceRules::key($request->header('Idempotency-Key'));$hash=hash('sha256',json_encode($v,JSON_THROW_ON_ERROR));$this->r->one('SELECT id FROM admin_users WHERE id=? FOR UPDATE',[$this->actor]);$prior=$this->r->query("SELECT * FROM idempotency_keys WHERE actor_scope=? AND method='POST' AND path_hash=? AND key_value=? FOR UPDATE",['admin:'.$this->actor,$pathHash,$key])->fetch();if($prior){if(!hash_equals($prior['request_hash'],$hash))throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Request key was used for different content.');return $this->json($prior['result_json']);}}
   $old=$id?$this->r->one('SELECT * FROM '.$table.' WHERE id=? FOR UPDATE',[$id]):null;if($old)CustomerSecurity::version($request,$old);$id=$id??CatalogueRepository::id();
   if($kind==='blog-categories'){Request::allowFields($v,['name','slug','status']);$values=['name'=>CMSRules::text($v['name']??'',200,true),'slug'=>CMSRules::slug($v['slug']??''),'status'=>$v['status']??'active'];if(!in_array($values['status'],['active','inactive'],true))CatalogueRules::fail('Invalid category status.');}
   else{
    Request::allowFields($v,$kind==='banners'?['title','name','description','desktop','mobile','alt','ctaLabel','destination','sortOrder','status','publishConfirmed']:['title','slug','description','excerpt','categoryId','image','video','blocks','seo','status','publishConfirmed','authorDisplay']);
    $status=$v['status']??'draft';if(!in_array($status,$kind==='banners'?['active','inactive','archived']:['draft','published','archived'],true))CatalogueRules::fail('Invalid publication status.');
    $public=$status===($kind==='banners'?'active':'published');if($public&&($v['publishConfirmed']??false)!==true)CatalogueRules::fail('Confirm publication of reviewed content.');
    $values=['title'=>CMSRules::text($v['title']??'',200,true),'status'=>$status,'published_at'=>$public?($old['published_at']??gmdate('Y-m-d H:i:s')):($old['published_at']??null)];
    if($kind==='banners'){$sort=$v['sortOrder']??0;if(!is_int($sort)||$sort<0||$sort>100000)CatalogueRules::fail('Invalid sort order.');$values+=['name'=>CMSRules::text($v['name']??'',200),'description'=>CMSRules::text($v['description']??''),'alt'=>CMSRules::text($v['alt']??'',200),'cta_label'=>CMSRules::text($v['ctaLabel']??'',200),'cta_destination'=>CMSRules::url($v['destination']??''),'sort_order'=>$sort];foreach(['desktop','mobile']as $slot){$m=$v[$slot]['mediaId']??null;$this->medium($m,'image',true);$values[$slot.'_media_asset_id']=$m?:null;}}
    else{
     $slug=CMSRules::slug($v['slug']??($old['slug']??''));if($kind==='pages'&&(!in_array($slug,CMSRules::PAGES,true)||($old&&$old['slug']!==$slug)))CatalogueRules::fail('Use a supported fixed page route.');
     $blocks=CMSRules::blocks($v['blocks']??[]);if($public&&!array_filter($blocks,fn($b)=>$b['text']!==''||$b['mediaId']))CatalogueRules::fail('Add reviewed content before publishing.');
     $values+=['slug'=>$slug,'blocks'=>json_encode($blocks,JSON_THROW_ON_ERROR),'seo_title'=>CMSRules::text($v['seo']['title']??'',200),'seo_description'=>CMSRules::text($v['seo']['description']??'')];
     if($kind==='blog'){$cat=$v['categoryId']??null;if($cat)$this->r->one('SELECT id FROM blog_categories WHERE id=?',[CommerceRules::id($cat)]);$image=$v['image']['mediaId']??null;$this->medium($image,'image',true);$values+=['excerpt'=>CMSRules::text($v['excerpt']??''),'blog_category_id'=>$cat?:null,'image_media_asset_id'=>$image?:null,'author_display'=>CMSRules::text($v['authorDisplay']??'',200),'author_admin_id'=>$old['author_admin_id']??$this->actor];}
     else{$video=$v['video']['mediaId']??null;$poster=$v['video']['posterMediaId']??null;$this->medium($video,'video',true);$this->medium($poster,'image',true);$values+=['description'=>CMSRules::text($v['description']??''),'video_media_asset_id'=>$video?:null,'poster_media_asset_id'=>$poster?:null];}
    }
   }
   if($old)$this->r->update($table,$id,$values);else $this->r->insert($table,['id'=>$id]+$values);
   if(in_array($kind,['blog','pages'],true)){$owner=$kind==='blog'?'blog_post_id':'cms_page_id';$this->r->query('DELETE FROM media_references WHERE '.$owner.'=?',[$id]);$this->references($blocks,$owner,$id,'blocks');}
   $this->audit('cms.save',$table,$id);$result=$this->record($kind,$this->r->one('SELECT * FROM '.$table.' WHERE id=?',[$id]),true);
   if($create)$this->r->insert('idempotency_keys',['id'=>CatalogueRepository::id(),'actor_scope'=>'admin:'.$this->actor,'method'=>'POST','path_hash'=>$pathHash,'key_value'=>$key,'request_hash'=>$hash,'status'=>'complete','result_status'=>201,'result_json'=>json_encode($result,JSON_THROW_ON_ERROR),'expires_at'=>gmdate('Y-m-d H:i:s',time()+86400)]);
   return $result;
  });
 }
 public function delete(string $kind,string $id,Request $request):array{$table=$this->table($kind);return $this->tx->transaction(function()use($kind,$id,$table,$request){$row=$this->r->one('SELECT * FROM '.$table.' WHERE id=? FOR UPDATE',[$id]);CustomerSecurity::version($request,$row);if($kind==='pages'||!empty($row['is_core_seed']))throw new HttpError(409,'REFERENCED_RESOURCE','Archive core content instead.');if($kind==='blog')$this->r->query('DELETE FROM media_references WHERE blog_post_id=?',[$id]);$this->r->query('DELETE FROM '.$table.' WHERE id=?',[$id]);$this->audit('cms.delete',$table,$id);return ['deleted'=>true];});}
 public function business(bool $admin=false):array{
  $b=$this->r->one("SELECT * FROM business_settings WHERE id='business-virasat'");$c=$this->r->one("SELECT * FROM compliance_settings WHERE id='compliance-settings'");
  $map=['name'=>'name','legalName'=>'legal_name','hindiName'=>'hindi_name','tagline'=>'tagline','logoAlt'=>'logo_alt','introduction'=>'introduction','email'=>'email','phone'=>'phone_e164','whatsapp'=>'whatsapp_e164','address'=>'address','operatingHours'=>'operating_hours','previewNotice'=>'preview_notice','footerNote'=>'footer_note'];$out=[];foreach($map as $key=>$col)$out[$key]=$b[$col]??'';
  foreach(['contactsVisible'=>'contacts_visible','announcementEnabled'=>'announcement_enabled','footerDescriptionVisible'=>'footer_description_visible']as $key=>$col)$out[$key]=(bool)$b[$col];
  $out+=['id'=>$b['id'],'version'=>(int)$b['version'],'currency'=>'INR','logoMediaId'=>$b['logo_media_asset_id'],'logoSrc'=>$b['logo_media_asset_id']?'/api/media/'.$b['logo_media_asset_id']:null,'store'=>['active'=>!$b['maintenance_enabled'],'acceptOrders'=>(bool)$b['accept_orders']],'razorpayEnabled'=>false,'seo'=>['title'=>$b['seo_title'],'description'=>$b['seo_description'],'siteUrl'=>$b['seo_site_url'],'image'=>['mediaId'=>$b['seo_image_media_asset_id'],'src'=>$b['seo_image_media_asset_id']?'/api/media/'.$b['seo_image_media_asset_id']:null]]];
  foreach(['gstin','fssai']as $kind){$value=$c[$kind.'_value'];$visible=(bool)$c[$kind.'_visible'];try{CMSRules::compliance($value,$kind,$visible);}catch(HttpError $e){$visible=false;}$out[$kind]=['value'=>$admin||$visible?$value:null,'visible'=>$visible];}
  $out['socialLinks']=$this->r->query('SELECT label,url FROM business_social_links WHERE business_id=? ORDER BY sort_order,id',[$b['id']])->fetchAll();
  $d=(new DeliveryService($this->r))->view();$out['codEnabled']=(bool)$d['settings']['codEnabled'];
  if($admin){$out['registrationDetails']=$c['notes']??'';$out['deliveryPolicy']=$d;}
  return $out;
 }
 public function saveBusiness(array $v,Request $request):array{
  Request::allowFields($v,['name','legalName','hindiName','tagline','logoMediaId','logoAlt','introduction','email','phone','whatsapp','address','operatingHours','contactsVisible','announcementEnabled','previewNotice','footerDescriptionVisible','footerNote','store','currency','seo','gstin','fssai','registrationDetails','socialLinks']);
  return $this->tx->transaction(function()use($v,$request){$b=$this->r->one("SELECT * FROM business_settings WHERE id='business-virasat' FOR UPDATE");CustomerSecurity::version($request,$b);$this->r->one("SELECT * FROM compliance_settings WHERE id='compliance-settings' FOR UPDATE");if(($v['currency']??'INR')!=='INR')CatalogueRules::fail('INR is required.');
   $map=['name'=>'name','legalName'=>'legal_name','hindiName'=>'hindi_name','tagline'=>'tagline','logoAlt'=>'logo_alt','introduction'=>'introduction','email'=>'email','phone'=>'phone_e164','whatsapp'=>'whatsapp_e164','address'=>'address','operatingHours'=>'operating_hours','previewNotice'=>'preview_notice','footerNote'=>'footer_note'];$values=[];foreach($map as $key=>$col)$values[$col]=CMSRules::text($v[$key]??'',in_array($key,['introduction','address','operatingHours','previewNotice','footerNote'],true)?10000:($key==='email'?254:200),$key==='name');
   if($values['email']!==''&&!filter_var($values['email'],FILTER_VALIDATE_EMAIL))CatalogueRules::fail('Invalid email.');foreach(['phone_e164','whatsapp_e164']as $key)if($values[$key]!==''&&!preg_match('/^\+[1-9][0-9]{7,14}$/D',$values[$key]))CatalogueRules::fail('Use international phone format, for example +91 followed by the number.');
   foreach(['contactsVisible'=>'contacts_visible','announcementEnabled'=>'announcement_enabled','footerDescriptionVisible'=>'footer_description_visible']as $key=>$col)$values[$col]=CMSRules::bool($v[$key]??false)?1:0;
   Request::allowFields($v['store']??[],['active','acceptOrders']);$values['maintenance_enabled']=CMSRules::bool($v['store']['active']??true)?0:1;$values['accept_orders']=CMSRules::bool($v['store']['acceptOrders']??false)?1:0;
   foreach(['logoMediaId'=>'logo_media_asset_id']as $key=>$col){$this->medium($v[$key]??null,'image',true);$values[$col]=$v[$key]??null;}
   Request::allowFields($v['seo']??[],['title','description','siteUrl','image']);$values['seo_title']=CMSRules::text($v['seo']['title']??'',200);$values['seo_description']=CMSRules::text($v['seo']['description']??'');$values['seo_site_url']=CMSRules::url($v['seo']['siteUrl']??'',false);$image=$v['seo']['image']['mediaId']??null;$this->medium($image,'image',true);$values['seo_image_media_asset_id']=$image;
   $compliance=['notes'=>CMSRules::text($v['registrationDetails']??'')];foreach(['gstin','fssai']as $kind){Request::allowFields($v[$kind]??[],['value','visible']);$visible=CMSRules::bool($v[$kind]['visible']??false);$compliance[$kind.'_value']=CMSRules::compliance($v[$kind]['value']??null,$kind,$visible);$compliance[$kind.'_visible']=$visible?1:0;}
   $social=$v['socialLinks']??[];if(!is_array($social)||count($social)>20)CatalogueRules::fail('At most 20 social links.');$this->r->query('DELETE FROM business_social_links WHERE business_id=?',[$b['id']]);foreach($social as $i=>$link){Request::allowFields($link,['label','url']);$this->r->insert('business_social_links',['id'=>CatalogueRepository::id(),'business_id'=>$b['id'],'label'=>CMSRules::text($link['label']??'',80,true),'url'=>CMSRules::url($link['url']??'',false),'sort_order'=>$i]);}
   $this->r->update('business_settings',$b['id'],$values);$this->r->update('compliance_settings','compliance-settings',$compliance);$this->audit('settings.save','business',$b['id']);return $this->business(true);
  });
 }
 public function mediaVisible(string $id):bool{
  $sql="SELECT 1 FROM media_references r JOIN homepage_sections h ON h.id=r.homepage_section_id WHERE r.media_asset_id=? AND r.field_path LIKE 'published.%' AND h.published_content IS NOT NULL AND JSON_EXTRACT(h.published_content,'$.enabled')=true UNION SELECT 1 FROM media_references r JOIN cms_pages p ON p.id=r.cms_page_id WHERE r.media_asset_id=? AND p.status='published' UNION SELECT 1 FROM media_references r JOIN blog_posts p ON p.id=r.blog_post_id WHERE r.media_asset_id=? AND p.status='published' UNION SELECT 1 FROM banners WHERE (desktop_media_asset_id=? OR mobile_media_asset_id=?) AND status='active' UNION SELECT 1 FROM cms_pages WHERE (video_media_asset_id=? OR poster_media_asset_id=?) AND status='published' UNION SELECT 1 FROM blog_posts WHERE image_media_asset_id=? AND status='published' UNION SELECT 1 FROM business_settings WHERE logo_media_asset_id=? OR seo_image_media_asset_id=? LIMIT 1";
  return (bool)$this->r->query($sql,array_fill(0,10,$id))->fetchColumn();
 }
}
