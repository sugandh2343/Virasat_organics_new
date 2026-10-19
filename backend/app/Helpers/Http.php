<?php
declare(strict_types=1);
namespace Virasat;
final class HttpError extends \RuntimeException {
 public int $status;public string $errorCode;
 public function __construct(int $status,string $code,string $message){parent::__construct($message);$this->status=$status;$this->errorCode=$code;}
}
final class Request {
 public string $method;public string $path;public array $server;
 public function __construct(array $server){
  $this->server=$server;$this->method=strtoupper($server['REQUEST_METHOD']??'GET');$path=parse_url($server['REQUEST_URI']??'/',PHP_URL_PATH);
  if(!is_string($path)||preg_match('/[%\\\\\x00-\x20]/',$path))throw new HttpError(400,'BAD_REQUEST','Invalid request path.');
  $this->path=$path;
 }
 public function header(string $name):string{return trim((string)($this->server['HTTP_'.strtoupper(str_replace('-','_',$name))]??''));}
 public function https(array $trusted):bool{
  if(isset($this->server['HTTPS'])&&$this->server['HTTPS']!==''&&$this->server['HTTPS']!=='off')return true;
  return in_array($this->server['REMOTE_ADDR']??'',$trusted,true)&&$this->header('X-Forwarded-Proto')==='https';
 }
 public function json(int $limit=65536):array{
  if(strtolower(trim(explode(';',$this->server['CONTENT_TYPE']??'')[0]))!=='application/json')throw new HttpError(415,'UNSUPPORTED_MEDIA','Use application/json.');
  $raw=file_get_contents('php://input',false,null,0,$limit+1);
  if($raw===false||strlen($raw)>$limit)throw new HttpError(413,'TOO_LARGE','Request body exceeds limit.');
  try{$data=json_decode($raw,false,32,JSON_THROW_ON_ERROR);}catch(\JsonException $e){throw new HttpError(400,'BAD_JSON','Invalid JSON.');}
  if(!$data instanceof \stdClass)throw new HttpError(400,'BAD_JSON','Expected a JSON object.');
  return (array)$data;
 }
 public static function allowFields(array $data,array $allowed):void{if(array_diff(array_keys($data),$allowed))throw new HttpError(422,'VALIDATION_FAILED','Unknown field.');}
}
final class Response {
 public static function send(int $status,array $body,string $id,array $headers=[]):void{
  http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');header('X-Request-ID: '.$id);
  foreach($headers as $name=>$value)header($name.': '.$value);
  if($status!==204&&$status!==304)echo json_encode($body+['requestId'=>$id],JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
 }
}
final class Router {
 private array $routes=[];
 public function add(string $method,string $path,callable $handler):void{$this->routes[$path][$method]=$handler;}
 public function methods(string $path):array{return array_keys($this->routes[$path]??[]);}
 public function dispatch(Request $r):array{
  $m=$this->methods($r->path);if(!$m)throw new HttpError(404,'NOT_FOUND','API endpoint not found.');
  if(!in_array($r->method,$m,true))throw new HttpError(405,'METHOD_NOT_ALLOWED','Method not allowed.');
  return ($this->routes[$r->path][$r->method])();
 }
}
