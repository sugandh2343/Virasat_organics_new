<?php
declare(strict_types=1);
namespace Virasat;
final class CatalogueController {
 private array $c;private Request $request;private string $requestId;
 public function __construct(array $c,Request $request,string $id){$this->c=$c;$this->request=$request;$this->requestId=$id;}
 public function register(Router $router):void{
  $routes=[
   '/api/products'=>['GET'],'/api/products/{id}'=>['GET'],
   '/api/categories'=>['GET'],'/api/categories/{id}'=>['GET'],
   '/api/media/{id}'=>['GET'],
   '/api/admin/session'=>['GET'],'/api/admin/login'=>['POST'],'/api/admin/logout'=>['POST'],
   '/api/admin/products'=>['GET','POST'],'/api/admin/products/{id}'=>['GET','PATCH','DELETE'],
   '/api/admin/products/{id}/duplicate'=>['POST'],
   '/api/admin/categories'=>['GET','POST'],'/api/admin/categories/{id}'=>['GET','PATCH','DELETE'],
   '/api/admin/inventory'=>['GET'],'/api/admin/inventory/history'=>['GET'],'/api/admin/inventory/adjustments'=>['POST'],
   '/api/admin/media'=>['GET','POST'],'/api/admin/media/{id}'=>['GET','PATCH','DELETE'],
  ];
  foreach($routes as $path=>$methods){
   $regex='#^'.str_replace('\{id\}','([a-zA-Z0-9_-]{1,120})',preg_quote($path,'#')).'$#D';
   if(preg_match($regex,$this->request->path,$m))foreach($methods as $method)$router->add($method,$this->request->path,fn()=>$this->dispatch($path,$m[1]??null));
  }
 }
 private function dispatch(string $path,?string $id):array{
  $request=$this->request;$method=$request->method;$admin=strpos($path,'/api/admin/')===0;$auth=new AdminAuth($this->c,$request);
  // Deny missing sessions before attempting the database on protected routes.
  if($admin&&!in_array($path,['/api/admin/session','/api/admin/login','/api/admin/logout'],true)){
   $auth->start();if(empty($_SESSION['admin_id']))throw new HttpError(401,'UNAUTHENTICATED','Admin login required.');
  }
  $r=new CatalogueRepository(Database::connect($this->c['db']));$actor='';
  if($admin&&!in_array($path,['/api/admin/session','/api/admin/login','/api/admin/logout'],true))$actor=strpos($path,'/api/admin/inventory')===0?$auth->inventoryGuard($r,$method!=='GET'):(strpos($path,'/api/admin/media')===0?$auth->mediaGuard($r,$method!=='GET'):$auth->guard($r,$method!=='GET'));
  $q=[];parse_str(parse_url($request->server['REQUEST_URI']??'',PHP_URL_QUERY)??'',$q);
  foreach($q as $v)if(!is_string($v))throw new HttpError(400,'BAD_REQUEST','Invalid query.');
  $body=$method==='GET'||$method==='DELETE'?[]:($path==='/api/admin/media'&&$method==='POST'?[]:$request->json());
  $status=200;$out=null;
  if($path==='/api/admin/session')$out=$auth->session($r);
  elseif($path==='/api/admin/login')$out=$auth->login($r,$body);
  elseif($path==='/api/admin/logout')$out=$auth->logout();
  elseif($path==='/api/media/{id}'){
   if(isset($_COOKIE[$this->c['session']['name']])){try{$actor=$auth->mediaGuard($r);}catch(HttpError $e){if(!in_array($e->status,[401,403],true))throw $e;}}
   (new CatalogueMedia($r,$actor,$this->requestId))->serve($id,$request);
  }
  elseif($method==='GET'){
   if(in_array($path,['/api/products','/api/admin/products','/api/admin/inventory'],true))return ['__catalogue'=>$r->products($q,$admin),'__status'=>200];
   elseif(in_array($path,['/api/products/{id}','/api/admin/products/{id}'],true)){
    $out=$r->getProduct($id,$admin);
    if(!$admin)$out['relatedProducts']=array_values(array_filter($r->products(['category'=>$out['categoryId'],'pageSize'=>6])['data'],fn($p)=>$p['id']!==$out['id']));
   }elseif(in_array($path,['/api/categories','/api/admin/categories'],true)){
    $out=array_map(fn($v)=>$r->category($v,$admin),$r->query('SELECT * FROM categories'.($admin?'':" WHERE status='active'").' ORDER BY sort_order,id')->fetchAll(\PDO::FETCH_ASSOC));
   }elseif(in_array($path,['/api/categories/{id}','/api/admin/categories/{id}'],true))$out=$r->category($r->one('SELECT * FROM categories WHERE '.($admin?'id':'slug').'=?'.($admin?'':" AND status='active'"),[$id]),$admin);
   elseif($path==='/api/admin/media')$out=array_map(function($m)use($r){$item=CatalogueRepository::media($m);$item['posterMediaId']=$r->query('SELECT poster_media_asset_id FROM product_videos WHERE media_asset_id=? AND poster_media_asset_id IS NOT NULL ORDER BY id LIMIT 1',[$m['id']])->fetchColumn()?:null;return $item;},$r->query("SELECT * FROM media_assets WHERE status='ready' ORDER BY created_at DESC,id")->fetchAll(\PDO::FETCH_ASSOC));
   elseif($path==='/api/admin/media/{id}')$out=CatalogueRepository::media($r->one('SELECT * FROM media_assets WHERE id=?',[$id]));
   elseif($path==='/api/admin/inventory/history'){
    $q=CatalogueRules::page($q);$where=isset($q['productId'])?' WHERE m.product_id=?':'';$args=isset($q['productId'])?[$q['productId']]:[];
    $total=(int)$r->query('SELECT COUNT(*) FROM inventory_movements m'.$where,$args)->fetchColumn();$rows=[];
    foreach($r->query('SELECT m.*,p.name FROM inventory_movements m JOIN products p ON p.id=m.product_id'.$where.' ORDER BY m.created_at DESC,m.id LIMIT '.$q['pageSize'].' OFFSET '.(($q['page']-1)*$q['pageSize']),$args)as $v)$rows[]=['id'=>$v['id'],'productId'=>$v['product_id'],'productName'=>$v['name'],'actorAdminId'=>$v['actor_admin_id'],'orderId'=>$v['order_id'],'kind'=>$v['kind'],'before'=>$v['kind']==='initialize'?null:(int)$v['resulting_on_hand']-(int)$v['on_hand_delta'],'after'=>(int)$v['resulting_on_hand'],'delta'=>$v['kind']==='initialize'?null:(int)$v['on_hand_delta'],'reason'=>$v['reason'],'createdAt'=>$v['created_at']];
    return ['__catalogue'=>['data'=>$rows,'meta'=>['page'=>$q['page'],'pageSize'=>$q['pageSize'],'total'=>$total]],'__status'=>200];
   }
  }else{
   $service=new CatalogueAdmin($r,$actor,$this->requestId,$request);
   if($path==='/api/admin/media'){$out=(new CatalogueMedia($r,$actor,$this->requestId))->upload();$status=201;}
   elseif($path==='/api/admin/media/{id}')$out=(new CatalogueMedia($r,$actor,$this->requestId))->edit($id,$body,$request,$method==='DELETE');
   else $out=$service->transaction($body,function()use($service,$path,$method,$id,$body){
    switch($path){
     case '/api/admin/products':return $service->saveProduct($body,null);
     case '/api/admin/products/{id}':return $method==='DELETE'?$service->deleteProduct($id):$service->saveProduct($body,$id);
     case '/api/admin/products/{id}/duplicate':return $service->duplicate($id);
     case '/api/admin/categories':return $service->saveCategory($body,null);
     case '/api/admin/categories/{id}':return $method==='DELETE'?$service->deleteCategory($id):$service->saveCategory($body,$id);
     case '/api/admin/inventory/adjustments':return $service->adjust($body);
    }
    throw new HttpError(404,'NOT_FOUND','Endpoint not found.');
   });
   if($method==='POST')$status=201;if($method==='DELETE')$status=204;
  }
  return ['__catalogue'=>['data'=>$out],'__status'=>$status];
 }
}
