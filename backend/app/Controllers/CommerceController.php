<?php
declare(strict_types=1);
namespace Virasat;
final class CommerceController {
 private array $c;private Request $q;private string $requestId;
 public function __construct(array $c,Request $q,string $requestId){$this->c=$c;$this->q=$q;$this->requestId=$requestId;}
 public function register(Router $router):void {
  $routes=['/api/commerce/status'=>['GET'],'/api/delivery/check'=>['POST'],'/api/delivery/quote'=>['POST'],'/api/checkout/quote'=>['POST'],'/api/orders'=>['POST'],'/api/me/orders'=>['GET'],'/api/me/orders/{id}'=>['GET'],'/api/me/orders/{id}/cancel'=>['POST'],'/api/admin/orders'=>['GET'],'/api/admin/orders/{id}'=>['GET','PATCH'],'/api/admin/delivery/settings'=>['GET','PATCH'],'/api/admin/delivery/zones'=>['POST'],'/api/admin/delivery/zones/{id}'=>['PATCH']];
  foreach($routes as $path=>$methods){$regex='#^'.str_replace('\{id\}','([a-zA-Z0-9_-]{1,64})',preg_quote($path,'#')).'$#D';if(preg_match($regex,$this->q->path,$match))foreach($methods as $method)$router->add($method,$this->q->path,fn()=>$this->dispatch($path,$match[1]??null));}
 }
 private function dispatch(string $path,?string $id):array {
  if($path==='/api/commerce/status'){CustomerSecurity::start($this->q,$this->c);$owner=$_SESSION['customer_id']??null;$enabled=false;if(LaunchGate::enabled(is_string($owner)?$owner:null))$enabled=(new CommerceService(new CatalogueRepository(Database::connect($this->c['db'])),$this->c))->storeEnabled();return ['orderAcceptanceEnabled'=>$enabled,'paymentMethods'=>['cod']];}
  $q=$this->q;$write=$q->method!=='GET';$admin=strpos($path,'/api/admin/')===0;$public=$path==='/api/delivery/check';
  if($admin){(new AdminAuth($this->c,$q))->start();if(empty($_SESSION['admin_id']))throw new HttpError(401,'UNAUTHENTICATED','Admin sign-in required.');}
  else {CustomerSecurity::start($q,$this->c);if(!$public&&empty($_SESSION['customer_id']))throw new HttpError(401,'UNAUTHENTICATED','Customer sign-in required.');}
  if($write)SessionSecurity::requireCsrf($q,$this->c);
  $r=new CatalogueRepository(Database::connect($this->c['db']));$service=new CommerceService($r,$this->c,$this->requestId);$delivery=new DeliveryService($r);$actor=null;$owner=null;
  if($admin)$actor=AdminAuthorization::requirePermission($r->db,strpos($path,'/api/admin/delivery/')===0?($write?'delivery.manage':'delivery.read'):($write?'orders.manage':'orders.read'));
  elseif(!$public)$owner=CustomerSecurity::owner($r)['id'];
  if($write)CustomerSecurity::rate($r,'commerce:'.($actor??$owner??($q->server['REMOTE_ADDR']??'')),60);
  // Request::json preserves nested objects; normalize only after rejecting non-object root.
  $body=$write?json_decode(json_encode($q->json(131072),JSON_THROW_ON_ERROR),true,64,JSON_THROW_ON_ERROR):[];
  $filters=[];parse_str(parse_url($q->server['REQUEST_URI']??'',PHP_URL_QUERY)??'',$filters);foreach($filters as $value)if(!is_string($value))CommerceRules::fail('VALIDATION_FAILED','Invalid query.');
  switch($path){
   case '/api/delivery/check':Request::allowFields($body,['postalCode']);return $delivery->evaluate(CommerceRules::pin($body['postalCode']??null));
   case '/api/delivery/quote':$quote=$service->quote($owner,$body,false);$quote['orderAcceptanceEnabled']=$quote['orderAcceptanceEnabled']&&LaunchGate::enabled($owner);return $quote;
   case '/api/checkout/quote':$quote=$service->quote($owner,$body);$quote['orderAcceptanceEnabled']=$quote['orderAcceptanceEnabled']&&LaunchGate::enabled($owner);return $quote;
   case '/api/orders':if(!LaunchGate::enabled($owner))throw new HttpError(503,'ORDER_ACCEPTANCE_DISABLED','Public ordering awaits Phase 7H acceptance.');return ['__status'=>201,'__catalogue'=>['data'=>$service->place($owner,$body,$q->header('Idempotency-Key'))]];
   case '/api/me/orders':return ['__catalogue'=>$service->listing($owner,$filters)];
   case '/api/me/orders/{id}':return $service->order($id,$owner);
   case '/api/me/orders/{id}/cancel':return $service->change($id,$body,$q,$owner);
   case '/api/admin/orders':return ['__catalogue'=>$service->listing(null,$filters)];
   case '/api/admin/orders/{id}':return $write?$service->change($id,$body,$q,null,$actor):$service->order($id,null,true);
   case '/api/admin/delivery/settings':if(!$write)return $delivery->view();return $service->transaction(function()use($delivery,$body,$q,$service,$actor){$value=$delivery->saveSettings($body,$q);$service->audit('delivery.settings','delivery','delivery-settings',$actor);return $value;});
   case '/api/admin/delivery/zones':
   case '/api/admin/delivery/zones/{id}':return $service->transaction(function()use($delivery,$body,$id,$q,$service,$actor){$value=$delivery->saveZone($body,$id,$q);$service->audit('delivery.zone','delivery',$value['savedZoneId'],$actor);return $value;});
  }
  throw new HttpError(404,'NOT_FOUND','Endpoint not found.');
 }
}
