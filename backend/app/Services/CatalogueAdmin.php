<?php
declare(strict_types=1);
namespace Virasat;
final class CatalogueAdmin {
 private CatalogueRepository $repo;private string $actor;private string $requestId;private Request $request;
 public function __construct(CatalogueRepository $repo,string $actor,string $requestId,Request $request){$this->repo=$repo;$this->actor=$actor;$this->requestId=$requestId;$this->request=$request;}
 public function transaction(array $body,callable $fn):array{
  $r=$this->repo;$key=$this->request->header('Idempotency-Key');$post=$this->request->method==='POST';
  if($post&&!preg_match('/^[A-Za-z0-9_-]{16,128}$/D',$key))throw new HttpError(400,'BAD_REQUEST','A unique Idempotency-Key is required.');
  $r->db->beginTransaction();
  try{
   $record=null;
   if($post){
    $hash=hash('sha256',json_encode($body,JSON_THROW_ON_ERROR));$pathHash=hash('sha256',$this->request->path);
    $r->query("INSERT IGNORE INTO idempotency_keys (id,actor_scope,method,path_hash,key_value,request_hash,status,expires_at) VALUES (?,?,'POST',?,?,?,'pending',DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 1 DAY))",[CatalogueRepository::id(),$this->actor,$pathHash,$key,$hash]);
    $record=$r->one("SELECT * FROM idempotency_keys WHERE actor_scope=? AND method='POST' AND path_hash=? AND key_value=? FOR UPDATE",[$this->actor,$pathHash,$key]);
    if(!hash_equals($record['request_hash'],$hash))throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Key already used with a different request.');
    if($record['status']==='complete'){$out=json_decode($record['result_json'],true,512,JSON_THROW_ON_ERROR);$r->db->commit();return $out;}
   }
   $out=$fn();
   if($record)$r->query("UPDATE idempotency_keys SET status='complete',result_status=200,result_json=? WHERE id=?",[json_encode($out,JSON_THROW_ON_ERROR),$record['id']]);
   $r->db->commit();return $out;
  }catch(\Throwable $e){
   if($r->db->inTransaction())$r->db->rollBack();
   if($e instanceof \PDOException&&$e->getCode()==='23000')throw new HttpError(409,'CONFLICT','SKU or slug already exists, or this record is still referenced.');
   if($e instanceof \PDOException&&$e->getCode()==='40001')throw new HttpError(409,'RETRY_LATER','Concurrent update; reload and retry.');
   throw $e;
  }
 }
 private function lock(string $table,string $id):array{
  $v=$this->repo->one("SELECT * FROM $table WHERE id=? FOR UPDATE",[$id]);
  $match=$this->request->header('If-Match');
  if($match==='')throw new HttpError(428,'PRECONDITION_REQUIRED','If-Match version required.');
  if($match!==(string)$v['version'])throw new HttpError(409,'VERSION_CONFLICT','Record changed. Reload before saving.');
  return $v;
 }
 private function media(string $id,string $kind):void{
  $r=$this->repo->one("SELECT id,kind FROM media_assets WHERE id=? AND status='ready' FOR UPDATE",[$id]);
  if($r['kind']!==$kind)CatalogueRules::fail('Incorrect media type.');
 }
 public function saveProduct(array $input,?string $id):array{
  $r=$this->repo;$old=$id?$this->lock('products',$id):null;
  $base=$id?$r->getProduct($id,true):[];
  // Only writable data is merged, never public/read-only projection fields.
  $keys=['name','slug','sku','size','categoryId','status','pricePaise','compareAtPricePaise','shortDescription','longDescription','ingredients','nutrition','storage','specifications','seo','keywords'];
  Request::allowFields($input,[...$keys,'stock','stockNote','imageIds','videoIds']);
  $merged=array_replace(array_intersect_key($base,array_flip($keys)),$input);
  foreach(['images'=>'imageIds','videos'=>'videoIds']as $source=>$target)if(!isset($merged[$target]))$merged[$target]=array_column($base[$source]??[],'id');
  $v=CatalogueRules::product($merged);$id=$id??CatalogueRepository::id();
  $r->one('SELECT id FROM categories WHERE id=? FOR UPDATE',[$v['categoryId']]);
  $values=['name'=>$v['name'],'slug'=>$v['slug'],'sku'=>$v['sku'],'size'=>$v['size'],'category_id'=>$v['categoryId'],'status'=>$v['status'],'price_paise'=>$v['pricePaise'],'compare_at_price_paise'=>$v['compareAtPricePaise'],'short_description'=>$v['shortDescription'],'long_description'=>$v['longDescription'],'storage'=>$v['storage'],'seo_title'=>$v['seo']['title'],'seo_description'=>$v['seo']['description']];
  foreach(['ingredients','nutrition','specifications','keywords']as $k)$values[$k]=$v[$k]===null?null:json_encode($v[$k],JSON_THROW_ON_ERROR);
  if($old)$r->update('products',$id,$values);else{$r->insert('products',['id'=>$id]+$values);$r->insert('inventory_balances',['product_id'=>$id,'on_hand'=>null,'reserved'=>0]);}
  if(array_key_exists('stock',$input)){
   $balance=$r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$id]);
   $before=$balance['on_hand']===null?null:(int)$balance['on_hand'];
   if($before!==$v['stock']){
    if($v['stock']===null)CatalogueRules::fail('Configured inventory cannot be reset to unknown.');
    $this->stock($id,'set',$v['stock'],$v['stockNote']??'');
   }
  }
  foreach(['imageIds'=>'product_images','videoIds'=>'product_videos']as $key=>$table){
   $posters=[];if($key==='videoIds')foreach($r->query('SELECT media_asset_id,poster_media_asset_id FROM product_videos WHERE product_id=?',[$id])as $existing)$posters[$existing['media_asset_id']]=$existing['poster_media_asset_id'];
   $r->query("DELETE FROM $table WHERE product_id=?",[$id]);
   foreach($v[$key]as $order=>$media){$this->media($media,$key==='imageIds'?'image':'video');$r->insert($table,['id'=>CatalogueRepository::id(),'product_id'=>$id,'media_asset_id'=>$media,'sort_order'=>$order]+($key==='videoIds'?['poster_media_asset_id'=>$posters[$media]??null]:[]));}
  }
  $r->audit($this->actor,$old?'update':'create','product',$id,$this->requestId);return $r->getProduct($id,true);
 }
 public function duplicate(string $id):array{
  $p=$this->repo->getProduct($id,true);$suffix=substr(CatalogueRepository::id(),0,10);
  $keys=['name','slug','sku','size','categoryId','shortDescription','longDescription','ingredients','nutrition','storage','specifications','seo','keywords'];
  $v=array_intersect_key($p,array_flip($keys));$v['name']=substr($p['name'],0,180).' (copy)';$v['slug']=substr($p['slug'],0,100).'-copy-'.$suffix;$v['sku']=substr($p['sku'],0,100).'-COPY-'.$suffix;
  $v['status']='inactive';$v['pricePaise']=null;$v['compareAtPricePaise']=null;$v['imageIds']=array_column($p['images'],'id');$v['videoIds']=array_column($p['videos'],'id');
  return $this->saveProduct($v,null);
 }
 public function deleteProduct(string $id):array{
  $p=$this->lock('products',$id);$r=$this->repo;
  if($p['is_core_seed']||$r->query('SELECT 1 FROM order_items WHERE product_id=? LIMIT 1',[$id])->fetchColumn())throw new HttpError(409,'REFERENCED_RESOURCE','Archive this product instead; seed and order history must be retained.');
  // All other restrictive FKs remain authoritative, including inventory history.
  $r->query('DELETE FROM product_images WHERE product_id=?',[$id]);$r->query('DELETE FROM product_videos WHERE product_id=?',[$id]);$r->query('DELETE FROM inventory_balances WHERE product_id=?',[$id]);$r->query('DELETE FROM products WHERE id=?',[$id]);
  $r->audit($this->actor,'delete','product',$id,$this->requestId);return ['deleted'=>true];
 }
 public function saveCategory(array $v,?string $id):array{
  Request::allowFields($v,['name','slug','description','status','sortOrder','imageId']);
  $r=$this->repo;$old=$id?$this->lock('categories',$id):null;
  if($old)$v=array_replace($r->category($old,true),$v);
  $name=CatalogueRules::text($v['name']??null,200,true);$slug=CatalogueRules::slug($v['slug']??null);$description=CatalogueRules::text($v['description']??null);
  if(!in_array($v['status']??null,['active','inactive'],true))CatalogueRules::fail('Invalid category status.');
  $sort=CatalogueRules::integer($v['sortOrder']??0,2147483647,false);$image=$v['imageId']??null;if($image)$this->media($image,'image');
  $values=['name'=>$name,'slug'=>$slug,'description'=>$description,'status'=>$v['status'],'sort_order'=>$sort,'image_media_asset_id'=>$image?:null];
  $id=$id??CatalogueRepository::id();if($old)$r->update('categories',$id,$values);else $r->insert('categories',['id'=>$id]+$values);
  $r->audit($this->actor,$old?'update':'create','category',$id,$this->requestId);return $r->category($r->one('SELECT * FROM categories WHERE id=?',[$id]),true);
 }
 public function deleteCategory(string $id):array{
  $this->lock('categories',$id);$r=$this->repo;
  if($r->query('SELECT 1 FROM products WHERE category_id=? LIMIT 1',[$id])->fetchColumn())throw new HttpError(409,'REFERENCED_RESOURCE','Reassign products before deleting this category.');
  $r->query('DELETE FROM categories WHERE id=?',[$id]);$r->audit($this->actor,'delete','category',$id,$this->requestId);return ['deleted'=>true];
 }
 private function stock(string $id,string $mode,$amount,string $reason):void{
  $r=$this->repo;AdminAuthorization::requireActorPermission($r->db,$this->actor,'inventory.write');CatalogueRules::text($reason,2000,true);
  $b=$r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$id]);$before=$b['on_hand']===null?null:(int)$b['on_hand'];
  $next=CatalogueRules::stock($before,(int)$b['reserved'],$mode,$amount);
  $r->query('UPDATE inventory_balances SET on_hand=?,version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE product_id=?',[$next,$id]);
  $r->insert('inventory_movements',['id'=>CatalogueRepository::id(),'product_id'=>$id,'actor_admin_id'=>$this->actor,'kind'=>$before===null?'initialize':'adjust','on_hand_delta'=>$next-($before??0),'reserved_delta'=>0,'reason'=>$reason,'idempotency_key'=>$this->request->header('Idempotency-Key')?:$this->requestId,'resulting_on_hand'=>$next,'resulting_reserved'=>(int)$b['reserved']]);
  $r->audit($this->actor,'stock.adjust','product',$id,$this->requestId);
 }
 public function adjust(array $v):array{
  Request::allowFields($v,['productId','mode','amount','reason']);
  $id=CatalogueRules::text($v['productId']??null,64,true);$this->lock('products',$id);
  $this->stock($id,$v['mode']??'adjust',$v['amount']??null,CatalogueRules::text($v['reason']??null,2000,true));
  $this->repo->query('UPDATE products SET version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE id=?',[$id]);return $this->repo->getProduct($id,true);
 }
}
