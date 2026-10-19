<?php
declare(strict_types=1);
namespace Virasat;
final class CustomerController {
 private array $c;private Request $request;
 public function __construct(array $c,Request $request){$this->c=$c;$this->request=$request;}
 public function register(Router $router):void {
  foreach(['/api/auth/csrf'=>['GET'],'/api/auth/me'=>['GET'],'/api/auth/firebase-session'=>['POST'],'/api/auth/logout'=>['POST'],'/api/me'=>['GET','PATCH'],'/api/me/addresses'=>['GET','POST'],'/api/me/addresses/{id}'=>['PATCH','DELETE'],'/api/me/wishlist'=>['GET','POST'],'/api/me/wishlist/{id}'=>['DELETE']]as $path=>$methods){
   $regex='#^'.str_replace('\{id\}','([a-zA-Z0-9_-]{1,64})',preg_quote($path,'#')).'$#D';
   if(preg_match($regex,$this->request->path,$m))foreach($methods as $method)$router->add($method,$this->request->path,fn()=>$this->dispatch($path,$m[1]??null));
  }
 }
 private function dispatch(string $path,?string $id):array {
  $q=$this->request;$write=$q->method!=='GET';CustomerSecurity::start($q,$this->c);
  if($write)SessionSecurity::requireCsrf($q,$this->c);
  if($path==='/api/auth/csrf')return ['csrfToken'=>SessionSecurity::csrfToken()];
  if($path==='/api/auth/logout'){$_SESSION=[];session_regenerate_id(true);return ['customer'=>null,'csrfToken'=>SessionSecurity::csrfToken()];}
  if($path!=='/api/auth/firebase-session'&&empty($_SESSION['customer_id']))throw new HttpError(401,'UNAUTHENTICATED','Customer sign-in required.');
  if($path==='/api/auth/firebase-session')FirebaseIdentity::configuredProject($this->c);
  $r=new CatalogueRepository(Database::connect($this->c['db']));$service=new CustomerAccounts($r);
  if($path==='/api/auth/firebase-session'){
   CustomerSecurity::rate($r,'login:'.($q->server['REMOTE_ADDR']??''),20);$body=$q->json(20000);Request::allowFields($body,['idToken']);
   if(!is_string($body['idToken']??null))throw new HttpError(422,'VALIDATION_FAILED','ID token required.');
   $identity=FirebaseIdentity::authenticate($body['idToken'],$this->c);CustomerSecurity::rate($r,'uid:'.$identity['uid'],10);
   $profile=$service->login($identity);session_regenerate_id(true);$_SESSION=['customer_id'=>$profile['id'],'started'=>time(),'last_seen'=>time()];
   return ['customer'=>$profile,'csrfToken'=>SessionSecurity::csrfToken()];
  }
  $owner=CustomerSecurity::owner($r);$customer=$owner['id'];if($write)CustomerSecurity::rate($r,'write:'.$customer,120);
  if($path==='/api/auth/me')return ['customer'=>CustomerAccounts::profile($owner),'csrfToken'=>SessionSecurity::csrfToken()];
  $body=$write&&$q->method!=='DELETE'?$q->json():[];
  if($path==='/api/me')return $write?$service->saveProfile($customer,$body,$q):CustomerAccounts::profile($owner);
  if($path==='/api/me/addresses')return $write?['__status'=>201,'__catalogue'=>['data'=>$service->saveAddress($customer,null,$body,$q)]]:$service->addresses($customer);
  if($path==='/api/me/addresses/{id}')return $service->saveAddress($customer,$id,$body,$q,$q->method==='DELETE');
  if($path==='/api/me/wishlist/{id}')return $service->saveWishlist($customer,$id,true);
  if($path==='/api/me/wishlist'){
   if(!$write)return $service->wishlist($customer);Request::allowFields($body,['productId']);$product=CatalogueRules::text($body['productId']??null,64,true);return $service->saveWishlist($customer,$product,false);
  }
  throw new HttpError(404,'NOT_FOUND','Endpoint not found.');
 }
}
