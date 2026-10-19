<?php
declare(strict_types=1);
require __DIR__.'/load.php';
use Virasat\{Request,Response,Router,HttpError,Configuration,Cors,SystemController};
ini_set('display_errors','0');ini_set('log_errors','1');error_reporting(E_ALL);
$id=bin2hex(random_bytes(16));$headers=[];$router=new Router();$r=null;
set_error_handler(static function(int $s,string $m,string $f,int $l):bool{if(!(error_reporting()&$s))return false;throw new ErrorException($m,0,$s,$f,$l);});
try{
 $c=Configuration::load(dirname(__DIR__).'/config/config.php');$r=new Request($_SERVER);
 if(!$r->https($c['trusted_proxies']))throw new HttpError(400,'HTTPS_REQUIRED','Use HTTPS for this API.');
 header('Strict-Transport-Security: max-age=31536000');
 $system=new SystemController($c);$router->add('GET','/api/health',[$system,'health']);$router->add('GET','/api/ready',[$system,'ready']);
 (new \Virasat\CatalogueController($c,$r,$id))->register($router);
 (new \Virasat\CustomerController($c,$r))->register($router);
 (new \Virasat\CommerceController($c,$r,$id))->register($router);
 (new \Virasat\PaymentController($c,$r))->register($router);
 (new \Virasat\CrawlerController($c))->register($router);
 (new \Virasat\OperationsController($c,$r,$id))->register($router);
 (new \Virasat\CMSController($c,$r,$id))->register($router);
 $methods=$router->methods($r->path);$headers=Cors::headers($r,$c,$methods);
 if($r->method==='OPTIONS'){if(!$methods)throw new HttpError(404,'NOT_FOUND','API endpoint not found.');Response::send(204,[],$id,$headers);return;}
 $result=$router->dispatch($r);
 Response::send($result['__status']??200,$result['__catalogue']??['data'=>$result],$id,array_replace($headers,$result['__headers']??[]));
}catch(HttpError $e){
 if($e->status===405&&$r)$headers['Allow']=implode(', ',array_merge($router->methods($r->path),['OPTIONS']));
 Response::send($e->status,['error'=>['code'=>$e->errorCode,'message'=>$e->getMessage()]],$id,$headers);
}catch(Throwable $e){
 error_log('virasat request='.$id.' failure='.get_class($e)); // no sensitive exception message
 Response::send(503,['error'=>['code'=>'SERVICE_UNAVAILABLE','message'=>'Service is not ready. Contact the operator with the request ID.']],$id,$headers);
}
