<?php
declare(strict_types=1);
// CLI subprocess harness; never starts an HTTP server or connects to a database.
if(PHP_SAPI!=='cli')exit(1);
$root=sys_get_temp_dir().'/virasat-php-'.bin2hex(random_bytes(8));
mkdir($root.'/config',0700,true);mkdir($root.'/bootstrap',0700,true);
function copyTree(string $from,string $to):void{
 if(!is_dir($to))mkdir($to,0700,true);
 foreach(new DirectoryIterator($from)as $entry){if($entry->isDot())continue;$dest=$to.'/'.$entry->getFilename();if($entry->isDir())copyTree($entry->getPathname(),$dest);else copy($entry->getPathname(),$dest);}
}
function removeTree(string $path):void{
 foreach(new DirectoryIterator($path)as $entry){if($entry->isDot())continue;if($entry->isDir())removeTree($entry->getPathname());else unlink($entry->getPathname());}rmdir($path);
}
try{
 copyTree(dirname(__DIR__).'/app',$root.'/app');copyTree(dirname(__DIR__).'/bootstrap',$root.'/bootstrap');
 copy(dirname(__DIR__).'/config/config.example.php',$root.'/config/config.php');
 mkdir($root.'/storage/sessions',0700,true);
 $cases=[
  ['/api/health','GET','on',null,200,'ok'],
  ['/api/ready','GET','on',null,503,'SERVICE_UNAVAILABLE'],
  ['/api/admin/products','GET','on',null,401,'UNAUTHENTICATED'],
  ['/api/admin/products','POST','on',null,401,'UNAUTHENTICATED'],
  ['/api/admin/media','POST','on',null,401,'UNAUTHENTICATED'],
  ['/api/orders','POST','on',null,401,'UNAUTHENTICATED'],
  ['/api/checkout/quote','POST','on',null,401,'UNAUTHENTICATED'],
  ['/api/me/orders','GET','on',null,401,'UNAUTHENTICATED'],
  ['/api/admin/orders','PATCH','on',null,405,'METHOD_NOT_ALLOWED'],
  ['/api/admin/orders','GET','on',null,401,'UNAUTHENTICATED'],
  ['/api/admin/delivery/settings','PATCH','on',null,401,'UNAUTHENTICATED'],
  ['/api/delivery/check','POST','on','https://virasatorganics.com',403,'CSRF_FAILED'],
  ['/api/unknown','GET','on',null,404,'NOT_FOUND'],
  ['/api/health','POST','on',null,405,'METHOD_NOT_ALLOWED'],
  ['/api/health','GET','off',null,400,'HTTPS_REQUIRED'],
  ['/api/health','GET','on','https://evil.invalid',403,'ORIGIN_DENIED'],
  ['/api/health','OPTIONS','on','https://virasatorganics.com',204,null],
 ];
 copy(dirname(__DIR__).'/config/config.example.php',$root.'/config/config.example.php');
 foreach(['legacy']as $configMode){
 if($configMode==='local'){
  unlink($root.'/config/config.php');
  file_put_contents($root.'/config/config.local.php',"<?php return ['db'=>['host'=>'','name'=>'','user'=>'','password'=>'']];");
 }
 foreach($cases as [$path,$method,$https,$origin,$status,$code]){
  $server=['REQUEST_URI'=>$path,'REQUEST_METHOD'=>$method,'HTTPS'=>$https,'HTTP_ACCESS_CONTROL_REQUEST_METHOD'=>'GET'];
  if($origin!==null)$server['HTTP_ORIGIN']=$origin;
  $source='<?php $_SERVER='.var_export($server,true).'; ob_start(); require '.var_export($root.'/bootstrap/app.php',true).'; $body=ob_get_clean(); echo json_encode(["status"=>http_response_code(),"body"=>$body]);';
  file_put_contents($root.'/case.php',$source);
  $process=proc_open([PHP_BINARY,'-n',$root.'/case.php'],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
  $out=stream_get_contents($pipes[1]);$err=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);$exit=proc_close($process);
  $result=json_decode($out,true,512,JSON_THROW_ON_ERROR);$body=$result['body']===''?[]:json_decode($result['body'],true,512,JSON_THROW_ON_ERROR);
  $actual=$body['data']['status']??$body['error']['code']??null;
  if($exit!==0||$result['status']!==$status||$actual!==$code)throw new RuntimeException('Dispatch case failed '.$path.' '.$method);
  if(strpos($result['body'],'password')!==false||strpos($result['body'],$root)!==false)throw new RuntimeException('Sensitive error leak.');
 }
 }
 echo "PASS: 17 real-bootstrap config.php CLI dispatch cases, including health200/ready503/404/405/HTTPS/CORS/preflight; no remote HTTP or DB.\n";
}finally{removeTree($root);}
