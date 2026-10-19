<?php
declare(strict_types=1);
namespace Virasat;
// Durable projection of committed domain events. Safe for shared-hosting cron, no daemon.
final class OperationNotifications {
 private CatalogueRepository $r;
 public function __construct(CatalogueRepository $r){$this->r=$r;}
 public const TEMPLATES=['placed'=>'Order placed','confirmed'=>'Order confirmed','packed'=>'Order packed','shipped'=>'Order shipped','out_for_delivery'=>'Order out for delivery','delivered'=>'Order delivered','cancelled'=>'Order cancelled','low_stock'=>'Low stock: review inventory'];
 public function sync(int $limit=100):int {
  $limit=max(1,min(500,$limit));$n=0;
  $events=$this->r->query("SELECT e.id,e.order_id,e.to_status,e.occurred_at FROM order_status_events e WHERE NOT EXISTS(SELECT 1 FROM operation_notifications n WHERE n.event_key=CONCAT('order:',e.id)) ORDER BY e.occurred_at,e.id LIMIT ".$limit)->fetchAll();
  foreach($events as $e)if(isset(self::TEMPLATES[$e['to_status']]))$n+=$this->put('order:'.$e['id'],$e['to_status'],$e['order_id'],self::TEMPLATES[$e['to_status']],$e['occurred_at']);
  $low=$this->r->query("SELECT b.* FROM inventory_balances b WHERE b.low_stock_threshold IS NOT NULL AND b.on_hand-b.reserved<=b.low_stock_threshold AND NOT EXISTS(SELECT 1 FROM operation_notifications n WHERE n.event_key=CONCAT('stock:',b.product_id,':',b.version)) ORDER BY b.product_id LIMIT ".$limit)->fetchAll();
  foreach($low as $b)$n+=$this->put('stock:'.$b['product_id'].':'.$b['version'],'low_stock',$b['product_id'],self::TEMPLATES['low_stock'],$b['updated_at']);return $n;
 }
 private function put(string $key,string $type,string $resource,string $text,string $time):int {return $this->r->query("INSERT IGNORE INTO operation_notifications(id,event_key,event_type,resource_id,message,occurred_at,email_status) VALUES(?,?,?,?,?,?,'disabled')",[CatalogueRepository::id(),$key,$type,$resource,$text,$time])->rowCount();}
 public function listing(string $actor,array $q):array {
  $this->sync();[$page,$size]=OperationsRules::page($q);$where=($q['unread']??'')==='true'?' WHERE reads.notification_id IS NULL':'';$join=' FROM operation_notifications n LEFT JOIN operation_notification_reads reads ON reads.notification_id=n.id AND reads.admin_user_id=?';
  $total=(int)$this->r->query('SELECT COUNT(*)'.$join.$where,[$actor])->fetchColumn();$rows=$this->r->query('SELECT n.id,n.event_type eventType,n.resource_id resourceId,n.message,n.occurred_at occurredAt,n.email_status emailStatus,reads.read_at readAt'.$join.$where.' ORDER BY n.occurred_at DESC,n.id DESC LIMIT '.$size.' OFFSET '.(($page-1)*$size),[$actor])->fetchAll();return ['data'=>$rows,'meta'=>['page'=>$page,'pageSize'=>$size,'total'=>$total],'delivery'=>'In-app only; external delivery disabled.'];
 }
 public function mark(string $id,string $actor,bool $read=true):array {$this->r->one('SELECT id FROM operation_notifications WHERE id=?',[$id]);if(!$read){$this->r->query('DELETE FROM operation_notification_reads WHERE notification_id=? AND admin_user_id=?',[$id,$actor]);return ['read'=>false];}$this->r->query('INSERT IGNORE INTO operation_notification_reads(notification_id,admin_user_id,read_at) VALUES(?,?,?)',[$id,$actor,gmdate('Y-m-d H:i:s')]);return ['read'=>true];}
 public function emailAdapter():array {return ['enabled'=>false,'sent'=>false,'reason'=>'No reviewed email provider or credentials configured.'];}
}
