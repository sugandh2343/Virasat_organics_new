<?php
declare(strict_types=1);
namespace Virasat;
final class PaymentController {
 private array $c;private Request $q;
 public function __construct(array $c,Request $q){$this->c=$c;$this->q=$q;}
 public function register(Router $router):void {foreach(['order','verify','webhook']as $action)$router->add('POST','/api/payments/razorpay/'.$action,fn()=>$this->dispatch($action));}
 private function dispatch(string $action):array {
  $provider=new RazorpayProvider($this->c);
  if($action==='webhook'){
   $provider->requireReady();$raw=file_get_contents('php://input',false,null,0,262145);if($raw===false||strlen($raw)>262144)throw new HttpError(413,'TOO_LARGE','Webhook body exceeds limit.');
   $provider->verifyWebhook($raw,$this->q->header('X-Razorpay-Signature'));
   $service=new RazorpayPayments(new CatalogueRepository(Database::connect($this->c['db'])),$this->c,$provider);
   return $service->webhook($raw,$this->q->header('X-Razorpay-Signature'),$this->q->header('X-Razorpay-Event-Id'));
  }
  CustomerSecurity::start($this->q,$this->c);if(empty($_SESSION['customer_id']))throw new HttpError(401,'UNAUTHENTICATED','Customer sign-in required.');
  SessionSecurity::requireCsrf($this->q,$this->c);$provider->requireReady();
  $r=new CatalogueRepository(Database::connect($this->c['db']));$owner=CustomerSecurity::owner($r)['id'];CustomerSecurity::rate($r,'payment:'.$owner,20);
  $body=$this->q->json(8192);$service=new RazorpayPayments($r,$this->c,$provider);
  return $action==='order'?$service->create($owner,$body,$this->q->header('Idempotency-Key')):$service->verify($owner,$body);
 }
}
