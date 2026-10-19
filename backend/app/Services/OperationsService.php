<?php
declare(strict_types=1);
namespace Virasat;
final class OperationsService {
 private CatalogueRepository $r;private array $c;private string $actor;private string $requestId;
 public function __construct(CatalogueRepository $r,array $c,string $actor,string $requestId='operations'){$this->r=$r;$this->c=$c;$this->actor=$actor;$this->requestId=$requestId;}
 private function commerce():CommerceService{return new CommerceService($this->r,$this->c,$this->requestId);}
 private function cohort(array $q):array {
  $range=OperationsRules::range($q);$where='o.placed_at>=? AND o.placed_at<?';$args=[$range['start'],$range['end']];
  foreach(['productId'=>'i.product_id','categoryId'=>'p.category_id']as $key=>$col)if(!empty($q[$key])){$id=CommerceRules::id($q[$key]);$where.=' AND EXISTS (SELECT 1 FROM order_items i JOIN products p ON p.id=i.product_id WHERE i.order_id=o.id AND '.$col.'=?)';$args[]=$id;}
  return [$where,$args,$range];
 }
 private function rows(string $sql,array $args):array {return $this->r->query($sql,$args)->fetchAll();}
 private function moneyRows(array $rows):array {foreach($rows as &$row)foreach($row as $k=>&$v)if(substr($k,-5)==='Paise'||in_array($k,['orders','quantity','count'],true))$v=OperationsRules::integer($v);return $rows;}
 private function paymentJoin():string {return " LEFT JOIN (SELECT order_id,SUM(amount_paise) collected FROM payments WHERE status='captured' AND captured_at IS NOT NULL GROUP BY order_id) pay ON pay.order_id=o.id ";}
 public function dashboard(array $q):array {
  [$where,$args,$range]=$this->cohort($q);
  $row=$this->r->one("SELECT COUNT(*) totalOrders,SUM(CASE WHEN o.status='placed' THEN 1 ELSE 0 END) awaitingConfirmation,SUM(CASE WHEN o.status IN ('confirmed','packed','shipped','out_for_delivery') THEN 1 ELSE 0 END) pendingFulfilment,SUM(CASE WHEN o.status='delivered' THEN 1 ELSE 0 END) completedOrders,SUM(CASE WHEN o.status='cancelled' THEN 1 ELSE 0 END) cancelledOrders,COALESCE(SUM(o.total_paise),0) grossOrderValuePaise,COALESCE(SUM(CASE WHEN o.status='cancelled' THEN o.total_paise ELSE 0 END),0) cancelledValuePaise,COALESCE(SUM(CASE WHEN o.payment_status='paid' AND o.status!='cancelled' THEN COALESCE(pay.collected,0) ELSE 0 END),0) collectedRevenuePaise,COALESCE(SUM(CASE WHEN o.payment_method='cod' AND o.payment_status!='paid' AND o.status!='cancelled' THEN o.total_paise ELSE 0 END),0) codOutstandingPaise FROM orders o".$this->paymentJoin().' WHERE '.$where,$args);
  foreach($row as &$v)$v=OperationsRules::integer($v??0);
  [$today,$todayArgs]=$this->cohort(['range'=>'today']);$row['todayOrders']=(int)$this->r->query('SELECT COUNT(*) FROM orders o WHERE '.$today,$todayArgs)->fetchColumn();
  $row['codCollectedPaise']=OperationsRules::integer($this->r->query('SELECT COALESCE(SUM(c.amount_paise),0) FROM cod_collections c JOIN orders o ON o.id=c.order_id WHERE '.$where,$args)->fetchColumn());
  $row['activeProducts']=(int)$this->r->query("SELECT COUNT(*) FROM products WHERE status='active'")->fetchColumn();$row['customerCount']=(int)$this->r->query('SELECT COUNT(*) FROM customers')->fetchColumn();
  $row['outOfStock']=(int)$this->r->query("SELECT COUNT(*) FROM products p JOIN inventory_balances b ON b.product_id=p.id WHERE p.status='out_of_stock' OR b.on_hand-b.reserved=0")->fetchColumn();
  $row['lowStock']=(int)$this->r->query('SELECT COUNT(*) FROM inventory_balances WHERE low_stock_threshold IS NOT NULL AND on_hand-reserved<=low_stock_threshold')->fetchColumn();$row['thresholdsUnconfigured']=(int)$this->r->query('SELECT COUNT(*) FROM inventory_balances WHERE low_stock_threshold IS NULL')->fetchColumn();
  return ['metrics'=>$row,'range'=>$range,'accounting'=>'Order-placement cohort; collected revenue requires paid order and captured payment. Cancelled and unpaid COD are separate. Catalogue/customer counts are current, not date filtered.'];
 }
 public function report(string $kind,array $q):array {
  if(!in_array($kind,['summary','daily','monthly','products','categories','status','cod','cancellations','delivery'],true))throw new HttpError(404,'NOT_FOUND','Report unavailable.');
  [$where,$args,$range]=$this->cohort($q);[$page,$size]=OperationsRules::page($q);$group='';$join=$this->paymentJoin();
  if($kind==='summary'){$v=$this->dashboard($q);return ['data'=>[$v['metrics']],'meta'=>['page'=>1,'pageSize'=>1,'total'=>1],'range'=>$range];}
  if(in_array($kind,['products','categories'],true)){
   $join=' JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id LEFT JOIN categories cat ON cat.id=p.category_id ';
   $key=$kind==='products'?'i.product_id':'p.category_id';$name=$kind==='products'?'MIN(i.name_snapshot)':'MIN(cat.name)';
   if(!empty($q['productId'])){$where.=' AND i.product_id=?';$args[]=$q['productId'];}if(!empty($q['categoryId'])){$where.=' AND p.category_id=?';$args[]=$q['categoryId'];}
   $select=$key.' id,'.$name." name,COUNT(DISTINCT o.id) orders,SUM(i.quantity) quantity,SUM(i.line_subtotal_paise) grossItemsPaise,SUM(CASE WHEN o.status='cancelled' THEN i.line_subtotal_paise ELSE 0 END) cancelledItemsPaise,SUM(CASE WHEN o.status='delivered' AND o.payment_status='paid' AND EXISTS(SELECT 1 FROM payments px WHERE px.order_id=o.id AND px.status='captured' AND px.captured_at IS NOT NULL) THEN i.line_subtotal_paise ELSE 0 END) finalizedItemsPaise";$group=$key;
  }elseif(in_array($kind,['daily','monthly','status','delivery'],true)){
   $key=in_array($kind,['status','delivery'],true)?'o.status':($kind==='daily'?"DATE(DATE_ADD(o.placed_at,INTERVAL 330 MINUTE))":"DATE_FORMAT(DATE_ADD(o.placed_at,INTERVAL 330 MINUTE),'%Y-%m')");
   $select=$key." period,COUNT(*) orders,SUM(o.total_paise) grossOrderValuePaise,SUM(CASE WHEN o.status='cancelled' THEN o.total_paise ELSE 0 END) cancelledValuePaise,SUM(CASE WHEN o.payment_status='paid' AND o.status!='cancelled' THEN COALESCE(pay.collected,0) ELSE 0 END) collectedRevenuePaise";$group=$key;
  }else{
   if($kind==='cancellations')$where.=" AND o.status='cancelled'";else $where.=" AND o.payment_method='cod'";
   $select="o.id,o.public_reference orderNumber,o.status,o.payment_status paymentStatus,o.placed_at placedAt,o.total_paise totalPaise,CASE WHEN o.payment_status='paid' AND o.status!='cancelled' THEN COALESCE(pay.collected,0) ELSE 0 END collectedPaise";
  }
  $base=' FROM orders o'.$join.' WHERE '.$where.($group?' GROUP BY '.$group:'');$total=(int)$this->r->query('SELECT COUNT(*) FROM (SELECT '.($group?:'o.id').$base.') report_rows',$args)->fetchColumn();
  $rows=$this->moneyRows($this->rows('SELECT '.$select.$base.' ORDER BY '.($group?:'o.placed_at DESC,o.id').' LIMIT '.$size.' OFFSET '.(($page-1)*$size),$args));
  return ['data'=>$rows,'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total],'range'=>$range,'definition'=>'Order-placement cohort. Item reports exclude shipping/tax and use current category membership; finalized item value is not allocated cash revenue.'];
 }
 public function customers(array $q,?string $id=null):array {
  [$page,$size]=OperationsRules::page($q);$needle=CatalogueRules::text($q['q']??'',100);$where=$id?'c.id=?':'1=1';$args=$id?[$id]:[];
  if($needle!==''){$where.=' AND (c.name LIKE ? OR c.phone_e164 LIKE ?)';$args[]='%'.$needle.'%';$args[]='%'.$needle.'%';}
  $total=(int)$this->r->query('SELECT COUNT(*) FROM customers c WHERE '.$where,$args)->fetchColumn();
  $rows=$this->rows('SELECT c.id,c.name,c.phone_e164 phone,c.email,c.status,c.phone_verified_at verifiedAt,c.created_at createdAt FROM customers c WHERE '.$where.' ORDER BY c.created_at DESC,c.id LIMIT '.$size.' OFFSET '.(($page-1)*$size),$args);
  if(!$id)return ['data'=>$rows,'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total]];
  if(!$rows)throw new HttpError(404,'NOT_FOUND','Customer unavailable.');$v=$rows[0];$v['addresses']=(new CustomerAccounts($this->r))->addresses($id);
  $v['totals']=$this->moneyRows([$this->r->one("SELECT COUNT(*) orders,COALESCE(SUM(o.total_paise),0) lifetimeOrderValuePaise,COALESCE(SUM(CASE WHEN o.status='cancelled' THEN o.total_paise ELSE 0 END),0) cancelledValuePaise,COALESCE(SUM(CASE WHEN o.payment_status='paid' AND o.status!='cancelled' THEN COALESCE(pay.collected,0) ELSE 0 END),0) collectedPaise FROM orders o".$this->paymentJoin().' WHERE o.customer_id=?',[$id])])[0];
  $v['orders']=$this->commerce()->listing($id,['page'=>$q['orderPage']??1,'pageSize'=>20]);return $v;
 }
 public function collect(string $id,array $v,Request $request):array {
  Request::allowFields($v,['amountPaise','referenceNote','confirmed']);if(($v['confirmed']??false)!==true)CatalogueRules::fail('Confirm that cash was actually collected.');$amount=CommerceRules::money($v['amountPaise']??null);$note=CatalogueRules::text($v['referenceNote']??null,500,true);$key=CommerceRules::key($request->header('Idempotency-Key'));
  return $this->commerce()->transaction(function()use($id,$amount,$note,$key,$request){$o=$this->r->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$id]);$existing=$this->r->query('SELECT * FROM cod_collections WHERE order_id=?',[$id])->fetch();if($existing){if($existing['request_key']===$key&&(int)$existing['amount_paise']===$amount&&$existing['reference_note']===$note)return $this->commerce()->order($id,null,true);throw new HttpError(409,'COD_ALREADY_RECORDED','Cash collection is already recorded.');}
   CustomerSecurity::version($request,$o);if($o['status']!=='delivered'||$o['payment_method']!=='cod'||$o['payment_status']!=='pending'||$amount!==(int)$o['total_paise'])throw new HttpError(409,'COD_NOT_ELIGIBLE','Only the full amount of an unpaid delivered COD order can be recorded.');
   $payments=$this->rows("SELECT * FROM payments WHERE order_id=? AND provider='cod' FOR UPDATE",[$id]);if(count($payments)!==1||$payments[0]['status']!=='created'||(int)$payments[0]['amount_paise']!==$amount)throw new HttpError(409,'PAYMENT_RECONCILIATION_REQUIRED','Review payment records.');
   $now=gmdate('Y-m-d H:i:s');$this->r->insert('cod_collections',['order_id'=>$id,'actor_admin_id'=>$this->actor,'amount_paise'=>$amount,'reference_note'=>$note,'request_key'=>$key,'collected_at'=>$now]);$this->r->update('payments',$payments[0]['id'],['status'=>'captured','captured_at'=>$now]);$this->r->update('orders',$id,['payment_status'=>'paid']);$this->commerce()->audit('cod.collected','order',$id,$this->actor,null,['amountPaise'=>$amount]);return $this->commerce()->order($id,null,true);
  });
 }
 public function note(string $id,array $v,Request $q):array {Request::allowFields($v,['note']);$note=CatalogueRules::text($v['note']??null,1000,true);return $this->commerce()->transaction(function()use($id,$note,$q){$o=$this->r->one('SELECT * FROM orders WHERE id=? FOR UPDATE',[$id]);CustomerSecurity::version($q,$o);$this->r->insert('order_notes',['id'=>CatalogueRepository::id(),'order_id'=>$id,'admin_user_id'=>$this->actor,'note'=>$note]);$this->r->update('orders',$id,['status'=>$o['status']]);$this->commerce()->audit('order.note','order',$id,$this->actor);return $this->commerce()->order($id,null,true);});}
 public function inventory(array $q):array {
  [$page,$size]=OperationsRules::page($q);$where='1=1';$args=[];if(!empty($q['productId'])){$where.=' AND p.id=?';$args[]=CommerceRules::id($q['productId']);}if(($q['stock']??'')==='low')$where.=' AND b.low_stock_threshold IS NOT NULL AND b.on_hand-b.reserved<=b.low_stock_threshold';elseif(($q['stock']??'')==='out')$where.=' AND b.on_hand-b.reserved=0';elseif(!empty($q['stock']))CatalogueRules::fail('Invalid stock filter.');
  $base=' FROM products p JOIN inventory_balances b ON b.product_id=p.id WHERE '.$where;$total=(int)$this->r->query('SELECT COUNT(*)'.$base,$args)->fetchColumn();$rows=$this->rows('SELECT p.id,p.name,p.sku,p.size,p.version productVersion,b.on_hand onHand,b.reserved,b.version,b.low_stock_threshold lowStockThreshold'.$base.' ORDER BY p.name,p.id LIMIT '.$size.' OFFSET '.(($page-1)*$size),$args);
  foreach($rows as &$v){foreach(['onHand','reserved','version','productVersion','lowStockThreshold']as $k)$v[$k]=$v[$k]===null?null:(int)$v[$k];$sum=$this->r->one('SELECT COUNT(*) count,COALESCE(SUM(on_hand_delta),0) balance FROM inventory_movements WHERE product_id=?',[$v['id']]);$v['ledgerOnHand']=(int)$sum['balance'];$v['reconciled']=$v['onHand']===null?null:((int)$sum['count']>0&&$v['onHand']===$v['ledgerOnHand']);}
  return ['data'=>$rows,'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total]];
 }
 public function threshold(string $id,array $v,Request $q):array {Request::allowFields($v,['threshold']);$n=$v['threshold']??null;if($n!==null&&(!is_int($n)||$n<0||$n>4294967295))CatalogueRules::fail('Threshold must be a nonnegative integer or null.');return $this->commerce()->transaction(function()use($id,$n,$q){$b=$this->r->one('SELECT * FROM inventory_balances WHERE product_id=? FOR UPDATE',[$id]);CustomerSecurity::version($q,$b);$this->r->query('UPDATE inventory_balances SET low_stock_threshold=?,version=version+1 WHERE product_id=?',[$n,$id]);$this->commerce()->audit('inventory.threshold','product',$id,$this->actor);return ['saved'=>true];});}
 public function document(string $id):array {$order=$this->commerce()->order($id,null,true);unset($order['internalNotes']);$b=(new CMSService($this->r,$this->actor))->business();return ['label'=>'Order summary — not a tax invoice','order'=>$order,'seller'=>array_intersect_key($b,array_flip(['name','legalName','address','email','phone','gstin','fssai'])),'billing'=>'No separate billing address is recorded. Delivery details are shown.'];}
}
