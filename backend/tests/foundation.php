<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{Request,Router,HttpError,Cors,Configuration,SystemController,SessionSecurity,UploadPolicy,Database};
$count=0;
function check(bool $value):void{global $count;if(!$value)throw new RuntimeException('Assertion failed #'.($count+1));$count++;}
function rejects(callable $fn,?int $status=null):void{
 try{$fn();}catch(Throwable $e){check($status===null||($e instanceof HttpError&&$e->status===$status));return;}throw new RuntimeException('Expected rejection.');
}
$c=Configuration::load(dirname(__DIR__).'/config/config.example.php');
$r=new Request(['REQUEST_URI'=>'/api/health?q=test','REQUEST_METHOD'=>'GET','HTTPS'=>'on']);
check($r->path==='/api/health');check($r->https([]));
check(!(new Request(['HTTP_X_FORWARDED_PROTO'=>'https','REMOTE_ADDR'=>'192.0.2.1']))->https([]));
check((new Request(['HTTP_X_FORWARDED_PROTO'=>'https','REMOTE_ADDR'=>'192.0.2.1']))->https(['192.0.2.1']));
rejects(fn()=>new Request(['REQUEST_URI'=>'/api/%2e%2e']),400);
$router=new Router();$system=new SystemController($c);
$router->add('GET','/api/health',[$system,'health']);$router->add('GET','/api/ready',[$system,'ready']);
check($router->dispatch($r)['status']==='ok');
rejects(fn()=>$router->dispatch(new Request(['REQUEST_URI'=>'/api/orders'])),404);
rejects(fn()=>$router->dispatch(new Request(['REQUEST_URI'=>'/api/health','REQUEST_METHOD'=>'POST'])),405);
rejects(fn()=>Database::connect($c['db'])); // unconfigured fails before connection
rejects(fn()=>Request::allowFields(['role'=>'admin'],['name']),422);
$origin=$c['app_origin'];
$allowed=new Request(['HTTP_ORIGIN'=>$origin]);
check(Cors::headers($allowed,$c,['GET'])['Access-Control-Allow-Origin']===$origin);
check(!isset(Cors::headers($allowed,$c,['GET'])['Access-Control-Allow-Credentials']));
foreach(['null','https://virasatorganics.com.attacker.invalid','http://localhost:5173','https://evil.invalid']as $o)rejects(fn()=>Cors::headers(new Request(['HTTP_ORIGIN'=>$o]),$c,['GET']),403);
$dev=$c;$dev['environment']='development';$locals=['http://localhost:5173','http://localhost:5174','http://127.0.0.1:5173','http://127.0.0.1:5174'];$dev['cors_origins']=array_merge([$origin],$locals);
foreach($locals as $o)check(Cors::headers(new Request(['HTTP_ORIGIN'=>$o]),$dev,['GET'])['Access-Control-Allow-Origin']===$o);
$pre=new Request(['REQUEST_METHOD'=>'OPTIONS','HTTP_ORIGIN'=>$origin,'HTTP_ACCESS_CONTROL_REQUEST_METHOD'=>'GET','HTTP_ACCESS_CONTROL_REQUEST_HEADERS'=>'Content-Type']);
check(Cors::headers($pre,$c,['GET'])['Access-Control-Allow-Methods']==='GET, OPTIONS');
rejects(fn()=>Cors::headers($pre,$c,[]),404);
rejects(fn()=>Cors::headers($pre,$c,['POST']),405);
rejects(fn()=>Cors::headers(new Request(['REQUEST_METHOD'=>'OPTIONS','HTTP_ORIGIN'=>$origin,'HTTP_ACCESS_CONTROL_REQUEST_METHOD'=>'GET','HTTP_ACCESS_CONTROL_REQUEST_HEADERS'=>'X-Untrusted']),$c,['GET']),403);
rejects(fn()=>SessionSecurity::requireCsrf($r,$c),403);
rejects(fn()=>UploadPolicy::inspect(__FILE__,1000,1000));
$tmp=tempnam(sys_get_temp_dir(),'virasat-config-');
try{
 foreach([array_merge($c,['cors_origins'=>['*']]),array_merge($c,['require_https'=>false]),array_merge($c,['trusted_proxies'=>['*']])]as $bad){
  file_put_contents($tmp,'<?php return '.var_export($bad,true).';');rejects(fn()=>Configuration::load($tmp));
 }
}finally{unlink($tmp);}
check(\Virasat\MigrationRunner::flavor('8.0.16')==='mysql');
check(\Virasat\MigrationRunner::flavor('10.11.11-MariaDB')==='mariadb');
check(\Virasat\MigrationRunner::flavor('5.5.5-10.11.11-MariaDB')==='mariadb');
foreach(['5.7.44','8.0.15','10.6.22-MariaDB','invalid']as $version)rejects(fn()=>\Virasat\MigrationRunner::flavor($version));
echo "PASS: $count database-free PHP assertions; no server, database or provider called.\n";
