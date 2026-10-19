<?php
declare(strict_types=1);
namespace Virasat;
final class Cors {
 public static function headers(Request $r,array $c,array $methods):array{
  $o=$r->header('Origin');if($o==='')return ['Vary'=>'Origin'];
  if(!in_array($o,$c['cors_origins'],true))throw new HttpError(403,'ORIGIN_DENIED','Origin is not allowed.');
  $h=['Vary'=>'Origin','Access-Control-Allow-Origin'=>$o];if($c['cors_credentials'])$h['Access-Control-Allow-Credentials']='true';
  if($r->method==='OPTIONS'){
   if(!$methods)throw new HttpError(404,'NOT_FOUND','API endpoint not found.');
   if(!in_array($r->header('Access-Control-Request-Method'),$methods,true))throw new HttpError(405,'METHOD_NOT_ALLOWED','Preflight method not allowed.');
   $requested=array_filter(array_map('trim',explode(',',strtolower($r->header('Access-Control-Request-Headers')))));
   if(array_diff($requested,['content-type','x-csrf-token','idempotency-key','if-match']))throw new HttpError(403,'HEADER_DENIED','Preflight header not allowed.');
   $h+=['Access-Control-Allow-Methods'=>implode(', ',$methods).', OPTIONS','Access-Control-Allow-Headers'=>'Content-Type, X-CSRF-Token, Idempotency-Key, If-Match','Access-Control-Max-Age'=>'300'];$h['Vary']='Origin, Access-Control-Request-Method, Access-Control-Request-Headers';
  }return $h;
 }
}
final class SessionSecurity {
 // Framework only: health/ready never start a session; no login endpoint implemented.
 public static function start(Request $r,array $c):void{
  if(!$r->https($c['trusted_proxies']))throw new HttpError(400,'HTTPS_REQUIRED','HTTPS required.');
  if(session_status()===PHP_SESSION_ACTIVE)return;
  $s=$c['session'];$path=realpath($s['path']);$root=realpath($_SERVER['DOCUMENT_ROOT']??'');
  if(!$path||!is_writable($path)||($root&&strncmp($path.DIRECTORY_SEPARATOR,$root.DIRECTORY_SEPARATOR,strlen($root)+1)===0))throw new \RuntimeException('Private session directory unavailable.');
  ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');ini_set('session.use_trans_sid','0');
  session_save_path($path);session_name($s['name']);session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
  if(!session_start())throw new \RuntimeException('Session unavailable.');
  $now=time();if(isset($_SESSION['started'])&&($now-$_SESSION['started']>$s['absolute_seconds']||$now-($_SESSION['last_seen']??0)>$s['idle_seconds'])){
   $_SESSION=[];session_regenerate_id(true);throw new HttpError(401,'SESSION_EXPIRED','Session expired.');
  }$_SESSION['started']=$_SESSION['started']??$now;$_SESSION['last_seen']=$now;
 }
 public static function csrfToken():string{
  if(session_status()!==PHP_SESSION_ACTIVE)throw new \LogicException('Session required.');
  return $_SESSION['csrf']??($_SESSION['csrf']=bin2hex(random_bytes(32)));
 }
 public static function requireCsrf(Request $r,array $c):void{
  if(session_status()!==PHP_SESSION_ACTIVE||$r->header('Origin')!==$c['app_origin'])throw new HttpError(403,'CSRF_FAILED','Same-origin session required.');
  $known=$_SESSION['csrf']??'';if($known===''||!hash_equals($known,$r->header('X-CSRF-Token')))throw new HttpError(403,'CSRF_FAILED','Invalid CSRF token.');
 }
}
final class AdminAuthorization {
 public static function requirePermission(\PDO $pdo,string $permission):string{
  $id=session_status()===PHP_SESSION_ACTIVE?($_SESSION['admin_id']??null):null;
  if(!is_string($id)||$id==='')throw new HttpError(401,'UNAUTHENTICATED','Admin authentication required.');
  return self::requireActorPermission($pdo,$id,$permission);
 }
 public static function requireActorPermission(\PDO $pdo,string $id,string $permission):string {
  $q=$pdo->prepare("SELECT u.id FROM admin_users u JOIN admin_user_roles ur ON ur.admin_user_id=u.id JOIN admin_role_permissions rp ON rp.role_id=ur.role_id WHERE u.id=:id AND u.status='active' AND rp.permission_key=:permission LIMIT 1");
  $q->execute(['id'=>$id,'permission'=>$permission]);if(!$q->fetch())throw new HttpError(403,'FORBIDDEN','Permission denied.');return $id;
 }
}
