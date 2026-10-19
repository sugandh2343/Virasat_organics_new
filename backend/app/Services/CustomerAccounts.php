<?php
declare(strict_types=1);
namespace Virasat;
final class CustomerAccounts {
 private CatalogueRepository $r;
 public function __construct(CatalogueRepository $r){$this->r=$r;}
 public static function profile(array $c):array {
  return ['id'=>$c['id'],'name'=>$c['name']??'','mobile'=>substr($c['phone_e164'],3),'phoneE164'=>$c['phone_e164'],'verified'=>true,'email'=>$c['email']??'','createdAt'=>$c['created_at'],'updatedAt'=>$c['updated_at'],'version'=>(int)$c['version']];
 }
 public function transaction(callable $fn){
  $this->r->db->beginTransaction();try{$v=$fn();$this->r->db->commit();return $v;}catch(\Throwable $e){if($this->r->db->inTransaction())$this->r->db->rollBack();if($e instanceof \PDOException&&$e->getCode()==='23000')throw new HttpError(409,'IDENTITY_CONFLICT','Account identity conflicts with an existing record. Contact support.');throw $e;}
 }
 public function login(array $identity):array {
  return $this->transaction(function()use($identity){
   $rows=$this->r->query('SELECT * FROM customers WHERE firebase_uid=? OR phone_e164=? FOR UPDATE',[$identity['uid'],$identity['phone']])->fetchAll();
   if($rows){if(count($rows)!==1||$rows[0]['firebase_uid']!==$identity['uid']||$rows[0]['phone_e164']!==$identity['phone'])throw new HttpError(409,'IDENTITY_CONFLICT','Account identity conflicts. Contact support.');if($rows[0]['status']!=='active')throw new HttpError(403,'ACCOUNT_DISABLED','This account is disabled.');return self::profile($rows[0]);}
   $id=CatalogueRepository::id();$this->r->query("INSERT INTO customers (id,firebase_uid,phone_e164,phone_verified_at,status) VALUES (?,?,?,UTC_TIMESTAMP(6),'active')",[$id,$identity['uid'],$identity['phone']]);
   return self::profile($this->r->one('SELECT * FROM customers WHERE id=?',[$id]));
  });
 }
 public function saveProfile(string $owner,array $body,Request $request):array {
  Request::allowFields($body,['name','email']);return $this->transaction(function()use($owner,$body,$request){
   $row=$this->r->one('SELECT * FROM customers WHERE id=? FOR UPDATE',[$owner]);CustomerSecurity::version($request,$row);
   $name=CatalogueRules::text($body['name']??$row['name'],80);$email=CatalogueRules::text($body['email']??$row['email'],254);
   if($email&&!filter_var($email,FILTER_VALIDATE_EMAIL))CatalogueRules::fail('Enter a valid email or leave it blank.');
   $this->r->update('customers',$owner,['name'=>$name?:null,'email'=>$email?:null]);return self::profile($this->r->one('SELECT * FROM customers WHERE id=?',[$owner]));
  });
 }
 public static function addressInput(array $v):array {
  Request::allowFields($v,['type','recipient','phone','line1','line2','locality','city','state','postalCode','landmark','instructions','country','isDefault','latitude','longitude','coordinatesConfirmed']);
  $out=[];foreach(['recipient'=>'recipient','line1'=>'building','line2'=>'street','locality'=>'locality','city'=>'city','state'=>'state']as $k=>$column)$out[$column]=CatalogueRules::text($v[$k]??null,200,true);
  foreach(['landmark','instructions']as $k)$out[$k]=CatalogueRules::text($v[$k]??null,200);
  if(!in_array($v['type']??null,['Home','Work','Other'],true))CatalogueRules::fail('Choose Home, Work or Other.');$out['label']=$v['type'];
  $phone=preg_replace('/[\s()-]/','',CatalogueRules::text($v['phone']??null,24,true));if(preg_match('/^[6-9][0-9]{9}$/D',$phone))$phone='+91'.$phone;
  if(!preg_match('/^\+91[6-9][0-9]{9}$/D',$phone))CatalogueRules::fail('Enter a valid Indian mobile number.');$out['phone_e164']=$phone;
  if(!is_string($v['postalCode']??null)||!preg_match('/^[1-9][0-9]{5}$/D',$v['postalCode']))CatalogueRules::fail('Enter a valid Indian PIN.');$out['postal_code']=$v['postalCode'];
  if(isset($v['country'])&&$v['country']!=='India')CatalogueRules::fail('Only India addresses are supported.');$out['country_code']='IN';
  foreach(['isDefault','coordinatesConfirmed']as $k)if(isset($v[$k])&&!is_bool($v[$k]))CatalogueRules::fail('Invalid boolean.');
  $lat=$v['latitude']??null;$lng=$v['longitude']??null;$confirmed=$v['coordinatesConfirmed']??false;
  if($lat!==null||$lng!==null){if(!$confirmed||!(is_int($lat)||is_float($lat))||!(is_int($lng)||is_float($lng))||!is_finite((float)$lat)||!is_finite((float)$lng)||abs($lat)>90||abs($lng)>180)CatalogueRules::fail('Confirm a valid map location or leave coordinates empty.');}
  elseif($confirmed)CatalogueRules::fail('Confirmed coordinates are missing.');
  $out['latitude']=$lat;$out['longitude']=$lng;$out['coordinates_confirmed']=$confirmed?1:0;return $out;
 }
 public static function address(array $a,?string $default):array {
  $out=['id'=>$a['id'],'type'=>$a['label'],'phone'=>substr($a['phone_e164'],3),'line1'=>$a['building'],'line2'=>$a['street'],'postalCode'=>$a['postal_code'],'country'=>'India','isDefault'=>$a['id']===$default,'version'=>(int)$a['version'],'createdAt'=>$a['created_at'],'updatedAt'=>$a['updated_at'],'latitude'=>$a['latitude']===null?null:(float)$a['latitude'],'longitude'=>$a['longitude']===null?null:(float)$a['longitude'],'coordinatesConfirmed'=>(bool)$a['coordinates_confirmed']];
  foreach(['recipient','locality','city','state','landmark','instructions']as $k)$out[$k]=$a[$k]??'';return $out;
 }
 public function addresses(string $owner):array {
  $default=$this->r->one('SELECT default_address_id FROM customers WHERE id=?',[$owner])['default_address_id'];
  return array_map(fn($a)=>self::address($a,$default),$this->r->query('SELECT * FROM addresses WHERE customer_id=? AND deleted_at IS NULL ORDER BY created_at,id',[$owner])->fetchAll());
 }
 public function saveAddress(string $owner,?string $id,array $body,Request $request,bool $delete=false):array {
  return $this->transaction(function()use($owner,$id,$body,$request,$delete){
   // Lock the owner first: serializes count checks, default changes and deletions.
   $customer=$this->r->one('SELECT * FROM customers WHERE id=? FOR UPDATE',[$owner]);$old=null;
   if($id){$old=$this->r->one('SELECT * FROM addresses WHERE id=? AND customer_id=? AND deleted_at IS NULL FOR UPDATE',[$id,$owner]);CustomerSecurity::version($request,$old);}
   if($delete){
    $this->r->query('UPDATE addresses SET deleted_at=UTC_TIMESTAMP(6),updated_at=UTC_TIMESTAMP(6),version=version+1 WHERE id=? AND customer_id=?',[$id,$owner]);
    if($customer['default_address_id']===$id){$next=$this->r->query('SELECT id FROM addresses WHERE customer_id=? AND deleted_at IS NULL ORDER BY created_at,id LIMIT 1',[$owner])->fetchColumn()?:null;$this->r->update('customers',$owner,['default_address_id'=>$next]);}
    return $this->addresses($owner);
   }
   $key=null;$hash=null;
   if(!$id){
    $key=$request->header('Idempotency-Key');if(!preg_match('/^[a-zA-Z0-9_-]{16,128}$/D',$key))throw new HttpError(428,'PRECONDITION_REQUIRED','Address creation requires an idempotency key.');
    $hash=hash('sha256',json_encode($body,JSON_THROW_ON_ERROR));$existing=$this->r->query('SELECT request_hash,result_json FROM idempotency_keys WHERE actor_scope=? AND method=? AND path_hash=? AND key_value=?',['customer:'.$owner,'POST',hash('sha256','/api/me/addresses'),$key])->fetch();
    if($existing){if($existing['request_hash']!==$hash)throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Use a new request key for changed details.');return $this->addresses($owner);}
    if((int)$this->r->query('SELECT COUNT(*) FROM addresses WHERE customer_id=? AND deleted_at IS NULL',[$owner])->fetchColumn()>=20)CatalogueRules::fail('At most 20 addresses may be saved.');
   }
   $base=$old?self::address($old,$customer['default_address_id']):[];foreach(['id','version','createdAt','updatedAt']as $k)unset($base[$k]);
   $v=self::addressInput(array_replace($base,$body));$makeDefault=($body['isDefault']??false)||!$customer['default_address_id'];
   if($id)$this->r->update('addresses',$id,$v);else{$id=CatalogueRepository::id();$this->r->insert('addresses',$v+['id'=>$id,'customer_id'=>$owner]);}
   if($makeDefault)$this->r->update('customers',$owner,['default_address_id'=>$id]);
   if($key)$this->r->query("INSERT INTO idempotency_keys (id,actor_scope,method,path_hash,key_value,request_hash,status,result_status,result_json,expires_at) VALUES (?,?,'POST',?,?,?,'complete',201,?,DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 1 DAY))",[CatalogueRepository::id(),'customer:'.$owner,hash('sha256','/api/me/addresses'),$key,$hash,json_encode(['id'=>$id])]);
   return $this->addresses($owner);
  });
 }
 public function wishlist(string $owner):array {
  return $this->r->query("SELECT w.product_id FROM wishlist_items w JOIN products p ON p.id=w.product_id WHERE w.customer_id=? AND p.status IN ('active','out_of_stock','coming_soon') ORDER BY w.created_at,w.product_id",[$owner])->fetchAll(\PDO::FETCH_COLUMN);
 }
 public function saveWishlist(string $owner,string $product,bool $delete):array {
  return $this->transaction(function()use($owner,$product,$delete){
   $this->r->one('SELECT id FROM customers WHERE id=? FOR UPDATE',[$owner]);
   if($delete)$this->r->query('DELETE FROM wishlist_items WHERE customer_id=? AND product_id=?',[$owner,$product]);
   else{$this->r->one("SELECT id FROM products WHERE id=? AND status IN ('active','out_of_stock','coming_soon') FOR UPDATE",[$product]);
    if((int)$this->r->query('SELECT COUNT(*) FROM wishlist_items WHERE customer_id=?',[$owner])->fetchColumn()>=500)CatalogueRules::fail('Wishlist limit reached.');
    $this->r->query('INSERT INTO wishlist_items (customer_id,product_id) VALUES (?,?) ON DUPLICATE KEY UPDATE product_id=VALUES(product_id)',[$owner,$product]);}
   return $this->wishlist($owner);
  });
 }
}
