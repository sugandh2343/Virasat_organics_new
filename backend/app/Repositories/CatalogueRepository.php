<?php
declare(strict_types=1);
namespace Virasat;
final class CatalogueRepository {
 public \PDO $db;
 public function __construct(\PDO $db){$this->db=$db;}
 public function query(string $sql,array $args=[]):\PDOStatement{$q=$this->db->prepare($sql);$q->execute($args);return $q;}
 public function one(string $sql,array $args=[]):array{$v=$this->query($sql,$args)->fetch(\PDO::FETCH_ASSOC);if(!$v)throw new HttpError(404,'NOT_FOUND','Record not found.');return $v;}
 public static function id():string{return bin2hex(random_bytes(16));}
 public function insert(string $table,array $values):void{$this->query('INSERT INTO '.$table.' ('.implode(',',array_keys($values)).') VALUES ('.implode(',',array_fill(0,count($values),'?')).')',array_values($values));}
 public function update(string $table,string $id,array $values):void{$this->query('UPDATE '.$table.' SET '.implode(',',array_map(fn($k)=>$k.'=?',array_keys($values))).',version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE id=?',[...array_values($values),$id]);}
 public static function media(array $r):array{
  return ['id'=>$r['id'],'mediaId'=>$r['id'],'src'=>'/api/media/'.$r['id'],'publicUrl'=>'/api/media/'.$r['id'],'name'=>$r['original_name'],'kind'=>$r['kind'],'mimeType'=>$r['mime_type'],'bytes'=>(int)$r['bytes'],'alt'=>$r['alt'],'caption'=>$r['caption'],'version'=>(int)$r['version'],'createdAt'=>$r['created_at'],'isPreview'=>false];
 }
 public function product(array $r):array{
  $p=['id'=>$r['id'],'slug'=>$r['slug'],'sku'=>$r['sku'],'name'=>$r['name'],'size'=>$r['size'],'categoryId'=>$r['category_id'],'category'=>$r['category_name'],'status'=>$r['status'],'pricePaise'=>$r['price_paise']===null?null:(int)$r['price_paise'],'compareAtPricePaise'=>$r['compare_at_price_paise']===null?null:(int)$r['compare_at_price_paise'],'stock'=>$r['on_hand']===null?null:max(0,(int)$r['on_hand']-(int)$r['reserved']),'onHand'=>$r['on_hand']===null?null:(int)$r['on_hand'],'version'=>(int)$r['version'],'shortDescription'=>$r['short_description'],'longDescription'=>$r['long_description'],'storage'=>$r['storage'],'seo'=>['title'=>$r['seo_title'],'description'=>$r['seo_description']],'updatedAt'=>$r['updated_at']];
  foreach(['ingredients','nutrition','specifications','keywords']as $key)$p[$key]=$r[$key]===null?null:json_decode($r[$key],true,32,JSON_THROW_ON_ERROR);
  foreach(['images'=>'product_images','videos'=>'product_videos']as $key=>$table){
   $p[$key]=[];
   foreach($this->query("SELECT m.*,a.sort_order".($key==='videos'?',a.poster_media_asset_id':'')." FROM $table a JOIN media_assets m ON m.id=a.media_asset_id WHERE a.product_id=? AND m.status='ready' ORDER BY a.sort_order",[$r['id']])as $m){
    $item=self::media($m);if($key==='videos')$item['poster']=$m['poster_media_asset_id']?'/api/media/'.$m['poster_media_asset_id']:null;$p[$key][]=$item;
   }
  }
  $p['purchasable']=CatalogueRules::purchasable($p);return $p;
 }
 private function select():string{return 'SELECT p.*,c.name AS category_name,b.on_hand,b.reserved FROM products p JOIN categories c ON c.id=p.category_id JOIN inventory_balances b ON b.product_id=p.id';}
 public function getProduct(string $key,bool $admin=false):array{return $this->product($this->one($this->select().' WHERE p.'.($admin?'id':'slug').'=?'.($admin?'':" AND p.status IN ('active','out_of_stock','coming_soon')"),[$key]));}
 public function products(array $q,bool $admin=false):array{
  $q=CatalogueRules::page($q);$where=[$admin?'1=1':"p.status IN ('active','out_of_stock','coming_soon')"];$args=[];
  if(isset($q['status'])){if(!in_array($q['status'],CatalogueRules::STATUSES,true))CatalogueRules::fail('Invalid status.');$where[]='p.status=?';$args[]=$q['status'];}
  if(!empty($q['category'])){$where[]='(c.slug=? OR c.id=?)';$args[]=$q['category'];$args[]=$q['category'];}
  $search=CatalogueRules::text($q['q']??'',100);
  foreach(preg_split('/\s+/u',trim($search),-1,PREG_SPLIT_NO_EMPTY)as $word){$where[]="LOWER(CONCAT_WS(' ',p.name,p.size,c.name,p.keywords)) LIKE ?";$args[]='%'.strtolower(str_replace(['\\','%','_'],['\\\\','\\%','\\_'],$word)).'%';}
  if(!empty($q['availability'])&&$q['availability']!=='all'){
   $available="p.status='active' AND p.price_paise IS NOT NULL AND b.on_hand>b.reserved";
   $options=['available'=>$available,'out_of_stock'=>"(p.status='out_of_stock' OR (p.status='active' AND b.on_hand=b.reserved))",'coming_soon'=>"(p.status='coming_soon' OR (p.status='active' AND (p.price_paise IS NULL OR b.on_hand IS NULL)))"];
   if(!isset($options[$q['availability']]))CatalogueRules::fail('Invalid availability.');$where[]='('.$options[$q['availability']].')';
  }
  $sorts=['default'=>'p.display_order,p.id','name-asc'=>'p.name,p.id','name-desc'=>'p.name DESC,p.id','price-asc'=>'p.price_paise IS NULL,p.price_paise,p.id','price-desc'=>'p.price_paise IS NULL,p.price_paise DESC,p.id'];
  $sort=$q['sort']??'default';if(!isset($sorts[$sort]))CatalogueRules::fail('Invalid sort.');
  $from=' FROM products p JOIN categories c ON c.id=p.category_id JOIN inventory_balances b ON b.product_id=p.id WHERE '.implode(' AND ',$where);
  $total=(int)$this->query('SELECT COUNT(*)'.$from,$args)->fetchColumn();
  $rows=$this->query($this->select().' WHERE '.implode(' AND ',$where).' ORDER BY '.$sorts[$sort].' LIMIT '.$q['pageSize'].' OFFSET '.(($q['page']-1)*$q['pageSize']),$args)->fetchAll(\PDO::FETCH_ASSOC);
  return ['data'=>array_map([$this,'product'],$rows),'meta'=>['page'=>$q['page'],'pageSize'=>$q['pageSize'],'total'=>$total]];
 }
 public function category(array $r,bool $admin=false):array{
  $image=$r['image_media_asset_id']?$this->query("SELECT * FROM media_assets WHERE id=? AND status='ready'",[$r['image_media_asset_id']])->fetch(\PDO::FETCH_ASSOC):null;
  return ['id'=>$r['id'],'slug'=>$r['slug'],'name'=>$r['name'],'description'=>$r['description'],'status'=>$r['status'],'sortOrder'=>(int)$r['sort_order'],'version'=>(int)$r['version'],'imageId'=>$r['image_media_asset_id'],'image'=>$image?self::media($image):null,'productCount'=>(int)$this->query('SELECT COUNT(*) FROM products WHERE category_id=?'.($admin?'':" AND status IN ('active','out_of_stock','coming_soon')"),[$r['id']])->fetchColumn()];
 }
 public function audit(string $actor,string $action,string $resource,string $id,string $requestId):void{
  $this->insert('audit_logs',['id'=>self::id(),'actor_admin_id'=>$actor,'action'=>$action,'resource_type'=>$resource,'resource_id'=>$id,'request_id'=>$requestId,'occurred_at'=>gmdate('Y-m-d H:i:s'),'source'=>'php-api']);
 }
}
