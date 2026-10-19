<?php
declare(strict_types=1);
namespace Virasat;
final class RazorpayPayments {
 private CatalogueRepository $r;private RazorpayProvider $provider;private CommerceService $transactions;
 public function __construct(CatalogueRepository $r,array $config,?RazorpayProvider $provider=null){$this->r=$r;$this->provider=$provider??new RazorpayProvider($config);$this->transactions=new CommerceService($r,$config);}
 private function owned(string $id,string $owner):array {return $this->r->one('SELECT * FROM orders WHERE id=? AND customer_id=? FOR UPDATE',[$id,$owner]);}
 private function online(array $o):void {if($o['payment_method']!=='razorpay')throw new HttpError(409,'PAYMENT_METHOD_CONFLICT','This order is not an online-payment order.');}
 private function held(array $o):array {
  $items=$this->r->query('SELECT product_id,quantity FROM order_items WHERE order_id=? ORDER BY product_id',[$o['id']])->fetchAll();
  $held=$this->r->query('SELECT * FROM inventory_reservations WHERE order_id=? ORDER BY product_id FOR UPDATE',[$o['id']])->fetchAll();
  if(!$items||count($held)!==count($items))return [];
  foreach($items as $n=>$item){$h=$held[$n];if($h['product_id']!==$item['product_id']||(int)$h['quantity']!==(int)$item['quantity']||$h['status']!=='held'||!$h['expires_at']||strtotime($h['expires_at'].' UTC')<=time())return [];}
  return $held;
 }
 private function result(array $p):array {return ['enabled'=>true,'providerOrderId'=>$p['provider_order_id'],'keyId'=>$this->provider->keyId(),'amountPaise'=>(int)$p['amount_paise'],'currency'=>$p['currency']];}
 public function create(string $owner,array $body,string $key):array {
  $this->provider->requireReady();Request::allowFields($body,['orderId']);$id=CommerceRules::id($body['orderId']??null);$key=CommerceRules::key($key);
  // Claim is durable BEFORE network I/O. No transaction is held during the API call.
  $claim=$this->transactions->transaction(function()use($owner,$id,$key){
   $o=$this->owned($id,$owner);$this->online($o);
   $prior=$this->r->query('SELECT * FROM razorpay_order_requests WHERE customer_id=? AND idempotency_key=? FOR UPDATE',[$owner,$key])->fetch();
   if($prior&&$prior['order_id']!==$id)throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Request key already belongs to another order.');
   $prior=$prior?:$this->r->query('SELECT * FROM razorpay_order_requests WHERE order_id=? FOR UPDATE',[$id])->fetch();
   if($o['status']!=='placed'||!in_array($o['payment_status'],['pending','failed'],true)||!$this->held($o))throw new HttpError(409,'PAYMENT_ORDER_INELIGIBLE','An owned pending online order with active stock reservations is required.');
   if($prior){if($prior['idempotency_key']!==$key)throw new HttpError(409,'IDEMPOTENCY_CONFLICT','Use the original payment request key.');if($prior['status']!=='ready')throw new HttpError(409,'PAYMENT_RECONCILIATION_REQUIRED','Payment order creation requires operator reconciliation. Do not start a new attempt.');return ['existing'=>$this->r->one('SELECT * FROM payments WHERE id=?',[$prior['payment_id']])];}
   $amount=(int)$o['total_paise'];CommerceRules::money($amount);if($amount<100||$o['currency']!=='INR')throw new HttpError(422,'PAYMENT_AMOUNT_INVALID','Invalid online payment amount or currency.');
   $pid=CatalogueRepository::id();$rid=CatalogueRepository::id();
   $this->r->insert('payments',['id'=>$pid,'order_id'=>$id,'provider'=>'razorpay','amount_paise'=>$amount,'currency'=>'INR','status'=>'created']);
   $this->r->insert('razorpay_order_requests',['id'=>$rid,'order_id'=>$id,'customer_id'=>$owner,'payment_id'=>$pid,'idempotency_key'=>$key,'status'=>'creating']);
   return ['id'=>$rid,'paymentId'=>$pid,'amount'=>$amount];
  });
  if(isset($claim['existing']))return $this->result($claim['existing']);
  try{
   $remote=$this->provider->createOrder($claim['amount'],$claim['paymentId']);$providerId=RazorpayProvider::id($remote['id']??null,'order');
   if(($remote['amount']??null)!==$claim['amount']||($remote['currency']??null)!=='INR'||($remote['receipt']??null)!==$claim['paymentId'])throw new HttpError(503,'PROVIDER_RESPONSE_INVALID','Provider order details do not match.');
   return $this->transactions->transaction(function()use($claim,$providerId){$this->r->update('payments',$claim['paymentId'],['provider_order_id'=>$providerId]);$this->r->update('razorpay_order_requests',$claim['id'],['status'=>'ready']);return $this->result($this->r->one('SELECT * FROM payments WHERE id=?',[$claim['paymentId']]));});
  }catch(\Throwable $e){
   // Never retry an ambiguous POST automatically. A crash leaves creating, also fail-closed.
   $this->r->update('razorpay_order_requests',$claim['id'],['status'=>'uncertain']);error_log('virasat payment failure=PAYMENT_ORDER_UNCERTAIN');
   throw new HttpError(503,'PAYMENT_RECONCILIATION_REQUIRED','Provider order creation could not be confirmed. Operator reconciliation is required.');
  }
 }
 public function verify(string $owner,array $body):array {
  $this->provider->requireReady();Request::allowFields($body,['orderId','razorpayOrderId','razorpayPaymentId','signature']);$id=CommerceRules::id($body['orderId']??null);
  $p=$this->transactions->transaction(function()use($owner,$id){$o=$this->owned($id,$owner);$this->online($o);return $this->r->one("SELECT * FROM payments WHERE order_id=? AND provider='razorpay' AND provider_order_id IS NOT NULL",[$id]);});
  $providerOrder=RazorpayProvider::id($body['razorpayOrderId']??null,'order');$payment=RazorpayProvider::id($body['razorpayPaymentId']??null,'pay');
  if($providerOrder!==$p['provider_order_id'])throw new HttpError(400,'PAYMENT_REFERENCE_MISMATCH','Payment order does not match.');
  if(!is_string($body['signature']??null))throw new HttpError(400,'PAYMENT_SIGNATURE_INVALID','Payment signature is required.');
  $this->provider->verifySignature($p['provider_order_id'],$payment,$body['signature']);
  return $this->apply($p['id'],$this->provider->fetchPayment($payment),$payment);
 }
 public function webhook(string $raw,string $signature,string $eventId):array {
  $this->provider->verifyWebhook($raw,$signature);
  if(!preg_match('/^[a-zA-Z0-9_-]{1,255}$/D',$eventId))throw new HttpError(400,'WEBHOOK_EVENT_INVALID','Webhook event ID is required.');
  try{$event=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\JsonException $e){throw new HttpError(400,'BAD_JSON','Invalid webhook JSON.');}
  if(!is_array($event)||!in_array($event['event']??null,['payment.authorized','payment.captured','payment.failed','order.paid'],true))return ['received'=>true,'ignored'=>true];
  $entity=$event['payload']['payment']['entity']??null;if(!is_array($entity))throw new HttpError(400,'WEBHOOK_EVENT_INVALID','Missing payment entity.');
  $paymentId=RazorpayProvider::id($entity['id']??null,'pay');$providerOrder=RazorpayProvider::id($entity['order_id']??null,'order');
  $p=$this->r->one("SELECT * FROM payments WHERE provider='razorpay' AND provider_order_id=?",[$providerOrder]);
  $hash=hash('sha256',$raw);$prior=$this->r->query("SELECT * FROM payment_events WHERE provider='razorpay' AND event_id=?",[$eventId])->fetch();
  if($prior){if(!hash_equals($prior['body_hash'],$hash))throw new HttpError(409,'WEBHOOK_EVENT_CONFLICT','Event ID was reused with different content.');if($prior['status']==='processed')return ['received'=>true];}
  // Signed snapshot is not sufficient: fetch current provider state to handle reordered events.
  $this->apply($p['id'],$this->provider->fetchPayment($paymentId),$paymentId,['id'=>$eventId,'hash'=>$hash]);return ['received'=>true];
 }
 private function apply(string $id,array $remote,string $expectedId,?array $event=null):array {
  return $this->transactions->transaction(function()use($id,$remote,$expectedId,$event){
   $before=$this->r->one('SELECT order_id FROM payments WHERE id=?',[$id]);$o=$this->r->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$before['order_id']]);$this->online($o);
   $p=$this->r->one('SELECT * FROM payments WHERE id=? FOR UPDATE',[$id]);
   if($p['provider']!=='razorpay'||($remote['id']??null)!==$expectedId||($remote['order_id']??null)!==$p['provider_order_id']||($remote['amount']??null)!==(int)$p['amount_paise']||($remote['currency']??null)!=='INR'||(int)$o['total_paise']!==(int)$p['amount_paise']||$o['currency']!=='INR')throw new HttpError(409,'PAYMENT_DETAILS_MISMATCH','Verified provider details do not match the stored order.');
   $state=$remote['status']??null;if(!in_array($state,['created','authorized','captured','failed'],true))throw new HttpError(409,'PAYMENT_STATE_UNSUPPORTED','Provider state requires operator reconciliation.');
   if($state==='captured'&&($remote['captured']??null)!==true)throw new HttpError(409,'PAYMENT_DETAILS_MISMATCH','Capture was not confirmed.');
   if($event){$prior=$this->r->query("SELECT * FROM payment_events WHERE provider='razorpay' AND event_id=? FOR UPDATE",[$event['id']])->fetch();if($prior){if(!hash_equals($prior['body_hash'],$event['hash']))throw new HttpError(409,'WEBHOOK_EVENT_CONFLICT','Event ID was reused.');return ['paymentStatus'=>$o['payment_status']];}}
   // Never regress a captured/refund state or permit another payment to finalize it.
   if(in_array($p['status'],['captured','refund_pending','refunded'],true)){
    if($state==='captured'&&$p['provider_payment_id']!==$expectedId)throw new HttpError(409,'PAYMENT_RECONCILIATION_REQUIRED','Another capture requires operator review.');
   }elseif($state==='captured'){
    $held=$o['status']==='placed'?$this->held($o):[];$usable=(bool)$held;
    foreach($held as $h){$b=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$h['product_id']]);if($b['on_hand']===null||(int)$b['on_hand']<(int)$h['quantity']||(int)$b['reserved']<(int)$h['quantity'])$usable=false;}
    if($usable)foreach($held as $h){$qty=(int)$h['quantity'];$this->r->query('UPDATE inventory_balances SET on_hand=on_hand-?,reserved=reserved-?,version=version+1 WHERE product_id=?',[$qty,$qty,$h['product_id']]);$this->r->update('inventory_reservations',$h['id'],['status'=>'consumed','consumed_at'=>gmdate('Y-m-d H:i:s')]);$b=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=?',[$h['product_id']]);$this->r->insert('inventory_movements',['id'=>CatalogueRepository::id(),'product_id'=>$h['product_id'],'order_id'=>$o['id'],'reservation_id'=>$h['id'],'kind'=>'deduct','on_hand_delta'=>-$qty,'reserved_delta'=>-$qty,'reason'=>'Verified online capture','idempotency_key'=>'razorpay:'.$id,'resulting_on_hand'=>(int)$b['on_hand'],'resulting_reserved'=>(int)$b['reserved']]);}
    $this->r->update('payments',$id,['status'=>$usable?'captured':'refund_pending','provider_payment_id'=>$expectedId,'captured_at'=>gmdate('Y-m-d H:i:s'),'verified_at'=>gmdate('Y-m-d H:i:s'),'failure_code'=>$usable?null:'CAPTURE_REQUIRES_REFUND_REVIEW']);
    $this->r->update('orders',$o['id'],['payment_status'=>$usable?'paid':'refund_pending']);$o['payment_status']=$usable?'paid':'refund_pending';
   }elseif($state==='authorized'){
    $this->r->update('payments',$id,['status'=>'authorized','provider_payment_id'=>$expectedId,'failure_code'=>null,'verified_at'=>gmdate('Y-m-d H:i:s')]);$this->r->update('orders',$o['id'],['payment_status'=>'authorized']);$o['payment_status']='authorized';
   }elseif($state==='failed'&&$p['status']!=='authorized'){
    $this->r->update('payments',$id,['status'=>'failed','provider_payment_id'=>$expectedId,'failure_code'=>'PROVIDER_PAYMENT_FAILED','verified_at'=>gmdate('Y-m-d H:i:s')]);$this->r->update('orders',$o['id'],['payment_status'=>'failed']);$o['payment_status']='failed';
   }
   if($event)$this->r->insert('payment_events',['id'=>CatalogueRepository::id(),'provider'=>'razorpay','event_id'=>$event['id'],'body_hash'=>$event['hash'],'payload_encrypted'=>null,'signature_verified_at'=>gmdate('Y-m-d H:i:s'),'received_at'=>gmdate('Y-m-d H:i:s'),'processed_at'=>gmdate('Y-m-d H:i:s'),'status'=>'processed','attempts'=>1,'payment_id'=>$id]);
   return ['paymentStatus'=>$o['payment_status']];
  });
 }
}
