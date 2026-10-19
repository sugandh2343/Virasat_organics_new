<?php
declare(strict_types=1);
namespace Virasat;
final class OperationsController {
 private array $c;private Request $q;private string $id;
 public function __construct(array $c,Request $q,string $id='operations'){$this->c=$c;$this->q=$q;$this->id=$id;}
 public function register(Router $r):void {
  foreach(['/api/admin/operations/options'=>['GET'],'/api/admin/dashboard'=>['GET'],'/api/admin/reports/{id}'=>['GET'],'/api/admin/customers'=>['GET'],'/api/admin/customers/{id}'=>['GET'],'/api/admin/orders/{id}/collect-cod'=>['POST'],'/api/admin/orders/{id}/notes'=>['POST'],'/api/admin/orders/{id}/document'=>['GET'],'/api/admin/operations/inventory'=>['GET'],'/api/admin/operations/inventory/{id}'=>['PATCH'],'/api/admin/notifications'=>['GET'],'/api/admin/notifications/{id}'=>['PATCH'],'/api/admin/delivery/health'=>['GET']]as $path=>$methods){$regex='#^'.str_replace('\{id\}','([a-zA-Z0-9_-]{1,64})',preg_quote($path,'#')).'$#D';if(preg_match($regex,$this->q->path,$m))foreach($methods as $method)$r->add($method,$this->q->path,fn()=>$this->dispatch($path,$m[1]??null));}
 }
 public static function permission(string $path,bool $write):string {
  if($path==='/api/admin/operations/options'||strpos($path,'/reports/')!==false||$path==='/api/admin/dashboard')return 'reports.read';
  if(strpos($path,'/customers')!==false)return 'customers.read';
  if(strpos($path,'/collect-cod')!==false)return 'payments.record_cod';
  if(strpos($path,'/notes')!==false)return 'orders.manage';
  if(strpos($path,'/document')!==false)return 'orders.read';
  if(strpos($path,'/inventory')!==false)return $write?'inventory.write':'inventory.read';
  if(strpos($path,'/notifications')!==false)return 'notifications.read';return 'delivery.read';
 }
 private function dispatch(string $path,?string $id):array {
  (new AdminAuth($this->c,$this->q))->start();if(empty($_SESSION['admin_id']))throw new HttpError(401,'UNAUTHENTICATED','Admin sign-in required.');$write=$this->q->method!=='GET';if($write)SessionSecurity::requireCsrf($this->q,$this->c);
  $r=new CatalogueRepository(Database::connect($this->c['db']));$actor=AdminAuthorization::requirePermission($r->db,self::permission($path,$write));if($write)CustomerSecurity::rate($r,'operations:'.$actor,60);
  $q=[];parse_str(parse_url($this->q->server['REQUEST_URI']??'',PHP_URL_QUERY)??'',$q);foreach($q as $v)if(!is_string($v))CatalogueRules::fail('Invalid query.');Request::allowFields($q,['page','pageSize','range','from','to','productId','categoryId','q','orderPage','stock','unread','export']);
  $body=$write?$this->q->json():[];$s=new OperationsService($r,$this->c,$actor,$this->id);
  if($path==='/api/admin/operations/options')$out=['products'=>$r->query('SELECT id,name,size FROM products ORDER BY name,id LIMIT 1000')->fetchAll(),'categories'=>$r->query('SELECT id,name FROM categories ORDER BY name,id LIMIT 1000')->fetchAll()];
  elseif($path==='/api/admin/dashboard')$out=$s->dashboard($q);
  elseif(strpos($path,'/reports/')!==false){$result=$s->report($id,$q);if(($q['export']??'')==='csv')return ['__catalogue'=>['data'=>['filename'=>'virasat-'.$id.'-page-'.($result['meta']['page']).'.csv','csv'=>OperationsRules::csv($result['data']),'scope'=>'Current filtered page; monetary columns are integer paise.']]];return ['__catalogue'=>$result];}
  elseif($path==='/api/admin/customers')return ['__catalogue'=>$s->customers($q)];
  elseif($path==='/api/admin/customers/{id}')$out=$s->customers($q,$id);
  elseif(strpos($path,'/collect-cod')!==false)$out=$s->collect($id,$body,$this->q);
  elseif(strpos($path,'/notes')!==false)$out=$s->note($id,$body,$this->q);
  elseif(strpos($path,'/document')!==false)$out=$s->document($id);
  elseif($path==='/api/admin/operations/inventory')return ['__catalogue'=>$s->inventory($q)];
  elseif($path==='/api/admin/operations/inventory/{id}')$out=$s->threshold($id,$body,$this->q);
  elseif($path==='/api/admin/notifications')return ['__catalogue'=>(new OperationNotifications($r))->listing($actor,$q)];
  elseif($path==='/api/admin/notifications/{id}'){Request::allowFields($body,['read']);if(isset($body['read'])&&!is_bool($body['read']))CatalogueRules::fail('Read state must be boolean.');$out=(new OperationNotifications($r))->mark($id,$actor,$body['read']??true);}
  else{$d=(new DeliveryService($r))->view();$settings=$d['settings'];$out=['configured'=>$settings['configured'],'taxReviewed'=>!empty($settings['taxPolicyVersion'])&&$settings['taxBasisPoints']!==null,'originConfigured'=>!empty($settings['origin']),'activeZones'=>count(array_filter($d['zones'],fn($z)=>$z['status']==='active')),'codConfigured'=>$settings['codEnabled'],'notice'=>'Phase 7H acceptance is pending. Do not activate public COD. See shared Delivery Settings.'];}
  return ['__catalogue'=>['data'=>$out]];
 }
}
