<?php
declare(strict_types=1);
namespace Virasat;
final class CommerceService {
 private CatalogueRepository $r; private array $config; private string $requestId;
 public function __construct(CatalogueRepository $r,array $config,string $requestId='offline'){$this->r=$r;$this->config=$config;$this->requestId=$requestId;}
 public function storeEnabled(bool $lock=false):bool {if(!CommerceRules::enabled($this->config))return false;$b=$this->r->query("SELECT accept_orders,maintenance_enabled FROM business_settings WHERE id='business-virasat'".($lock?' FOR UPDATE':''))->fetch();return $b&&(bool)$b['accept_orders']&&!(bool)$b['maintenance_enabled'];}
 public function transaction(callable $fn){
  $this->r->db->beginTransaction();try{$value=$fn();$this->r->db->commit();return $value;}catch(\Throwable $e){if($this->r->db->inTransaction())$this->r->db->rollBack();if($e instanceof \PDOException){if(in_array((int)($e->errorInfo[1]??0),[1205,1213],true))throw new HttpError(409,'RETRY_TRANSACTION','Please retry with the same request key.');if($e->getCode()==='23000')throw new HttpError(409,'RECORD_CONFLICT','A conflicting record exists. Reload before retrying.');}throw $e;}
 }
 public function audit(string $action,string $type,string $id,?string $admin=null,?string $customer=null,array $detail=[]):void {
  $this->r->insert('audit_logs',['id'=>CatalogueRepository::id(),'action'=>$action,'resource_type'=>$type,'resource_id'=>$id,'request_id'=>$this->requestId,'occurred_at'=>gmdate('Y-m-d H:i:s'),'source'=>'commerce','actor_admin_id'=>$admin,'actor_customer_id'=>$customer,'redacted_after'=>json_encode($detail,JSON_THROW_ON_ERROR)]);
 }
 private function customer(string $id):array {$c=$this->r->one('SELECT * FROM customers WHERE id=? FOR UPDATE',[$id]);if($c['status']!=='active'||empty($c['phone_verified_at']))CommerceRules::fail('UNAUTHENTICATED','A verified active customer is required.',401);return $c;}
 private function calculate(string $owner,array $body):array {
  Request::allowFields($body,['addressId','items','paymentMethod']);if(($body['paymentMethod']??'cod')!=='cod')CommerceRules::fail('PAYMENT_UNAVAILABLE','Only Cash on Delivery is supported.');
  $input=CommerceRules::items($body['items']??null);$delivery=new DeliveryService($this->r);$settings=$delivery->settings(true);
  $address=$this->r->one('SELECT * FROM addresses WHERE id=? AND customer_id=? AND deleted_at IS NULL FOR UPDATE',[CommerceRules::id($body['addressId']??null),$owner]);
  if(empty($settings['tax_policy_version'])||$settings['tax_basis_points']===null)CommerceRules::fail('UNCONFIGURED','A reviewed tax policy is required.');
  $items=[];$subtotal=0;$tax=0;
  foreach($input as $i){
   $p=$this->r->one('SELECT * FROM products WHERE id=? FOR UPDATE',[$i['productId']]);
   $stock=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$p['id']]);
   if($p['status']!=='active'||$p['price_paise']===null)CommerceRules::fail('NOT_PURCHASABLE','A cart product is unavailable or its price is unconfigured.');
   if(isset($i['sku'])&&$i['sku']!==$p['sku'])CommerceRules::fail('INVALID_SKU','Product reference and SKU do not match.');
   if($stock['on_hand']===null||(int)$stock['on_hand']-(int)$stock['reserved']<$i['quantity'])CommerceRules::fail('INSUFFICIENT_STOCK','A cart product has insufficient available stock.');
   $line=CommerceRules::line((int)$p['price_paise'],$i['quantity']);$lineTax=CommerceRules::tax($line,$settings['tax_mode'],(int)$settings['tax_basis_points']);
   $subtotal=CommerceRules::sum($subtotal,$line);$tax=CommerceRules::sum($tax,$lineTax);
   $items[]=['productId'=>$p['id'],'productVersion'=>(int)$p['version'],'sku'=>$p['sku'],'name'=>$p['name'],'size'=>$p['size'],'quantity'=>$i['quantity'],'unitPricePaise'=>(int)$p['price_paise'],'lineSubtotalPaise'=>$line,'taxPaise'=>$lineTax];
  }
  $coverage=$delivery->evaluate($address['postal_code'],$subtotal);if(!$coverage['codEnabled'])CommerceRules::fail('COD_UNAVAILABLE','Cash on Delivery is unavailable for this address.');
  if($settings['tax_shipping'])$tax=CommerceRules::sum($tax,CommerceRules::tax($coverage['shippingPaise'],$settings['tax_mode'],(int)$settings['tax_basis_points']));
  $snapshot=CustomerAccounts::address($address,null);unset($snapshot['isDefault']);
  return ['addressId'=>$address['id'],'addressVersion'=>(int)$address['version'],'address'=>$snapshot,'items'=>$items,'delivery'=>$coverage,'taxPolicyVersion'=>$settings['tax_policy_version'],'currency'=>'INR','subtotalPaise'=>$subtotal,'shippingPaise'=>$coverage['shippingPaise'],'taxPaise'=>$tax,'totalPaise'=>CommerceRules::sum($subtotal,$coverage['shippingPaise'],$tax),'paymentMethods'=>['cod']];
 }
 public function quote(string $owner,array $body,bool $persist=true):array {
  return $this->transaction(function()use($owner,$body,$persist){$this->customer($owner);$v=$this->calculate($owner,$body);$v['orderAcceptanceEnabled']=$this->storeEnabled();if(!$persist)return $v;
   $id=CatalogueRepository::id();$expiry=gmdate('Y-m-d H:i:s',time()+600);
   $this->r->insert('checkout_quotes',['id'=>$id,'customer_id'=>$owner,'address_id'=>$v['addressId'],'address_version'=>$v['addressVersion'],'settings_version'=>$v['delivery']['settingsVersion'],'delivery_zone_id'=>$v['delivery']['zoneId'],'subtotal_paise'=>$v['subtotalPaise'],'shipping_paise'=>$v['shippingPaise'],'tax_paise'=>$v['taxPaise'],'total_paise'=>$v['totalPaise'],'payment_methods'=>'["cod"]','expires_at'=>$expiry,'snapshot'=>json_encode($v,JSON_THROW_ON_ERROR)]);
   foreach($v['items']as $i)$this->r->insert('quote_items',['id'=>CatalogueRepository::id(),'quote_id'=>$id,'product_id'=>$i['productId'],'product_version'=>$i['productVersion'],'quantity'=>$i['quantity'],'unit_price_paise'=>$i['unitPricePaise'],'line_subtotal_paise'=>$i['lineSubtotalPaise'],'tax_paise'=>$i['taxPaise']]);
   return $v+['id'=>$id,'expiresAt'=>CommerceRules::time($expiry)];
  });
 }
 public function place(string $owner,array $body,string $key):array {
  Request::allowFields($body,['quoteId','paymentMethod','deliveryInstructions']);$key=CommerceRules::key($key);$quoteId=CommerceRules::id($body['quoteId']??null);if(($body['paymentMethod']??null)!=='cod')CommerceRules::fail('PAYMENT_UNAVAILABLE','Cash on Delivery is required.');
  $instructions=CatalogueRules::text($body['deliveryInstructions']??null,200);$hash=hash('sha256',json_encode([$quoteId,'cod',$instructions],JSON_THROW_ON_ERROR));
  return $this->transaction(function()use($owner,$quoteId,$instructions,$key,$hash){
   $customer=$this->customer($owner);
   $existing=$this->r->query('SELECT * FROM orders WHERE customer_id=? AND idempotency_key=? FOR UPDATE',[$owner,$key])->fetch();
   if($existing){if(!hash_equals($existing['request_hash']??'',$hash))CommerceRules::fail('IDEMPOTENCY_CONFLICT','This request key was used with different details.',409);return $this->order($existing['id'],$owner);}
   if(!$this->storeEnabled(true))CommerceRules::fail('ORDER_ACCEPTANCE_DISABLED','Order placement is not enabled yet.',503);
   $q=$this->r->one('SELECT * FROM checkout_quotes WHERE id=? AND customer_id=? FOR UPDATE',[$quoteId,$owner]);
   if($q['consumed_order_id'])CommerceRules::fail('QUOTE_CONSUMED','This quote already has an order. Open order history.',409);
   if(strtotime($q['expires_at'].' UTC')<=time())CommerceRules::fail('QUOTE_EXPIRED','This quote expired. Review a fresh quote.',409);
   $saved=json_decode($q['snapshot']??'null',true,64,JSON_THROW_ON_ERROR);if(!is_array($saved)||empty($saved['items']))CommerceRules::fail('QUOTE_STALE','Request a new checkout quote.',409);
   $fresh=$this->calculate($owner,['addressId'=>$q['address_id'],'items'=>array_map(fn($i)=>['productId'=>$i['productId'],'quantity'=>$i['quantity'],'sku'=>$i['sku']],$saved['items']),'paymentMethod'=>'cod']);
   unset($saved['orderAcceptanceEnabled']);if($fresh!=$saved)CommerceRules::fail('QUOTE_STALE','Products, address or delivery settings changed. Review a fresh quote.',409);
   $id=CatalogueRepository::id();$reference='VO-'.gmdate('Ymd').'-'.strtoupper(bin2hex(random_bytes(8)));
   $this->r->insert('orders',['id'=>$id,'public_reference'=>$reference,'status'=>'placed','payment_method'=>'cod','payment_status'=>'pending','subtotal_paise'=>$fresh['subtotalPaise'],'shipping_paise'=>$fresh['shippingPaise'],'tax_paise'=>$fresh['taxPaise'],'total_paise'=>$fresh['totalPaise'],'delivery_address_snapshot'=>json_encode($fresh['address'],JSON_THROW_ON_ERROR),'customer_snapshot'=>json_encode(['name'=>$customer['name'],'phoneE164'=>$customer['phone_e164'],'verified'=>true],JSON_THROW_ON_ERROR),'delivery_instructions'=>$instructions,'idempotency_key'=>$key,'request_hash'=>$hash,'placed_at'=>gmdate('Y-m-d H:i:s'),'customer_id'=>$owner,'quote_id'=>$quoteId]);
   foreach($fresh['items']as $i){
    $this->r->insert('order_items',['id'=>CatalogueRepository::id(),'order_id'=>$id,'product_id'=>$i['productId'],'sku_snapshot'=>$i['sku'],'name_snapshot'=>$i['name'],'size_snapshot'=>$i['size'],'quantity'=>$i['quantity'],'unit_price_paise'=>$i['unitPricePaise'],'line_subtotal_paise'=>$i['lineSubtotalPaise'],'tax_paise'=>$i['taxPaise']]);
    $changed=$this->r->query('UPDATE inventory_balances SET on_hand=on_hand-?,version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE product_id=? AND on_hand IS NOT NULL AND on_hand-reserved>=?',[$i['quantity'],$i['productId'],$i['quantity']])->rowCount();if($changed!==1)CommerceRules::fail('INSUFFICIENT_STOCK','Stock changed. Request a new quote.',409);
    $this->movement($i['productId'],$id,'deduct',-$i['quantity'],null);
   }
   $this->r->query('UPDATE checkout_quotes SET consumed_order_id=?,version=version+1 WHERE id=?',[$id,$quoteId]);
   $this->r->insert('payments',['id'=>CatalogueRepository::id(),'order_id'=>$id,'provider'=>'cod','amount_paise'=>$fresh['totalPaise'],'status'=>'created']);
   $this->event($id,null,'placed',null,$owner);$this->audit('order.placed','order',$id,null,$owner,['status'=>'placed']);return $this->order($id,$owner);
  });
 }
 private function movement(string $product,string $order,string $kind,int $delta,?string $admin):void {
  $b=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=?',[$product]);$this->r->insert('inventory_movements',['id'=>CatalogueRepository::id(),'product_id'=>$product,'order_id'=>$order,'actor_admin_id'=>$admin,'kind'=>$kind,'on_hand_delta'=>$delta,'reserved_delta'=>0,'reason'=>$kind==='deduct'?'COD order placed':'Order cancelled','idempotency_key'=>'order:'.$order.':'.$kind,'resulting_on_hand'=>(int)$b['on_hand'],'resulting_reserved'=>(int)$b['reserved']]);
 }
 private function event(string $id,?string $from,string $to,?string $admin,?string $customer):void {$this->r->insert('order_status_events',['id'=>CatalogueRepository::id(),'order_id'=>$id,'from_status'=>$from,'to_status'=>$to,'occurred_at'=>gmdate('Y-m-d H:i:s'),'actor_admin_id'=>$admin,'actor_customer_id'=>$customer]);}
 public function change(string $id,array $body,Request $request,?string $customer=null,?string $admin=null):array {
  Request::allowFields($body,$admin?['status','internalNote']:[]);$target=$admin?($body['status']??null):'cancelled';if(!is_string($target))CommerceRules::fail('VALIDATION_FAILED','Choose a status.');$note=$admin?(CatalogueRules::text($body['internalNote']??null,1000)??''):'';
  if($admin&&$target==='cancelled'&&$note==='')CatalogueRules::fail('An internal cancellation reason is required.');
  return $this->transaction(function()use($id,$target,$note,$request,$customer,$admin){
   $row=$this->r->one('SELECT * FROM orders WHERE id=?'.($customer?' AND customer_id=?':'').' FOR UPDATE',$customer?[$id,$customer]:[$id]);
   if($row['payment_method']!=='cod')throw new HttpError(409,'ONLINE_ORDER_REVIEW_REQUIRED','Online order fulfilment and cancellation require the reviewed payment lifecycle.');
   if($row['status']==='cancelled'&&$target==='cancelled'&&$note==='')return $this->order($id,$customer,$admin!==null);
   CustomerSecurity::version($request,$row);CommerceRules::transition($row['status'],$target);
   if($target==='cancelled'){
    foreach($this->r->query('SELECT * FROM order_items WHERE order_id=? ORDER BY product_id',[$id])->fetchAll()as $i){
     $this->r->one('SELECT id FROM products WHERE id=? FOR UPDATE',[$i['product_id']]);$b=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$i['product_id']]);
     if($b['on_hand']===null||(int)$b['on_hand']>4294967295-(int)$i['quantity'])CommerceRules::fail('INVENTORY_CONFLICT','Inventory must be reviewed before cancellation.',409);
     $this->r->query('UPDATE inventory_balances SET on_hand=on_hand+?,version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE product_id=?',[(int)$i['quantity'],$i['product_id']]);$this->movement($i['product_id'],$id,'restock',(int)$i['quantity'],$admin);
    }
   }
   $this->r->update('orders',$id,['status'=>$target]);$this->event($id,$row['status'],$target,$admin,$customer);
   if($note!=='')$this->r->insert('order_notes',['id'=>CatalogueRepository::id(),'order_id'=>$id,'admin_user_id'=>$admin,'note'=>$note]);
   $this->audit('order.status','order',$id,$admin,$customer,['from'=>$row['status'],'to'=>$target]);return $this->order($id,$customer,$admin!==null);
  });
 }
 public function order(string $id,?string $owner=null,bool $admin=false):array {
  $o=$this->r->one('SELECT * FROM orders WHERE id=?'.($owner?' AND customer_id=?':''),$owner?[$id,$owner]:[$id]);
  $out=['id'=>$o['id'],'orderNumber'=>$o['public_reference'],'status'=>$o['status'],'paymentMethod'=>$o['payment_method'],'paymentStatus'=>$o['payment_status'],'currency'=>$o['currency'],'version'=>(int)$o['version'],'createdAt'=>CommerceRules::time($o['placed_at']),'address'=>json_decode($o['delivery_address_snapshot'],true),'customer'=>json_decode($o['customer_snapshot'],true),'deliveryInstructions'=>$o['delivery_instructions']];
  foreach(['subtotal','shipping','tax','total']as $key)$out[$key.'Paise']=(int)$o[$key.'_paise'];
  $out['items']=array_map(fn($i)=>['productId'=>$i['product_id'],'sku'=>$i['sku_snapshot'],'name'=>$i['name_snapshot'],'size'=>$i['size_snapshot'],'quantity'=>(int)$i['quantity'],'unitPricePaise'=>(int)$i['unit_price_paise'],'lineSubtotalPaise'=>(int)$i['line_subtotal_paise'],'taxPaise'=>(int)$i['tax_paise']],$this->r->query('SELECT * FROM order_items WHERE order_id=? ORDER BY product_id',[$id])->fetchAll());
  $out['statusEvents']=array_map(fn($e)=>['id'=>$e['id'],'fromStatus'=>$e['from_status'],'status'=>$e['to_status'],'occurredAt'=>CommerceRules::time($e['occurred_at']),'note'=>$e['public_note']],$this->r->query('SELECT * FROM order_status_events WHERE order_id=? ORDER BY occurred_at,created_at,id',[$id])->fetchAll());
  if($admin)$out['internalNotes']=$this->r->query('SELECT id,note,created_at AS createdAt FROM order_notes WHERE order_id=? ORDER BY created_at,id',[$id])->fetchAll();return $out;
 }
 public function listing(?string $owner,array $q):array {
  Request::allowFields($q,['page','pageSize','status','q','from','to']);$page=filter_var($q['page']??1,FILTER_VALIDATE_INT);$size=filter_var($q['pageSize']??20,FILTER_VALIDATE_INT);if(!$page||$page<1||$page>100000||!$size||$size<1||$size>100)CommerceRules::fail('VALIDATION_FAILED','Invalid pagination.');
  $where=$owner?'customer_id=?':'1=1';$args=$owner?[$owner]:[];if(isset($q['status'])&&$q['status']!==''){if(!in_array($q['status'],['placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'],true))CommerceRules::fail('VALIDATION_FAILED','Invalid status.');$where.=' AND status=?';$args[]=$q['status'];}
  if(!empty($q['q'])){$needle=CatalogueRules::text($q['q'],100,true);$where.=' AND (public_reference LIKE ? OR customer_snapshot LIKE ?)';$args[]='%'.$needle.'%';$args[]='%'.$needle.'%';}
  if(isset($q['from'])||isset($q['to'])){$dates=OperationsRules::range(['range'=>'custom','from'=>$q['from']??'','to'=>$q['to']??'']);$where.=' AND placed_at>=? AND placed_at<?';$args[]=$dates['start'];$args[]=$dates['end'];}
  $total=(int)$this->r->query('SELECT COUNT(*) FROM orders WHERE '.$where,$args)->fetchColumn();$ids=$this->r->query('SELECT id FROM orders WHERE '.$where.' ORDER BY placed_at DESC,id DESC LIMIT '.$size.' OFFSET '.(($page-1)*$size),$args)->fetchAll(\PDO::FETCH_COLUMN);
  return ['data'=>array_map(fn($id)=>$this->order($id,$owner,$owner===null),$ids),'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total]];
 }
}
