<?php
declare(strict_types=1);
namespace Virasat;
final class AdminAuth {
 private array $config;private Request $request;
 public function __construct(array $c,Request $r){$this->config=$c;$this->request=$r;}
 public function start():void{SessionSecurity::start($this->request,$this->config);}
 public function session(CatalogueRepository $r):array{
  $this->start();$admin=null;
  if(isset($_SESSION['admin_id'])){
   $admin=$r->query("SELECT id,name,email FROM admin_users WHERE id=? AND status='active'",[$_SESSION['admin_id']])->fetch(\PDO::FETCH_ASSOC)?:null;
   if(!$admin)unset($_SESSION['admin_id']);
  }
  return ['admin'=>$admin,'csrfToken'=>SessionSecurity::csrfToken()];
 }
 public function guard(CatalogueRepository $r,bool $write=false):string{
  $this->start();if($write)SessionSecurity::requireCsrf($this->request,$this->config);
  return AdminAuthorization::requirePermission($r->db,'catalogue.write');
 }

 public function inventoryGuard(CatalogueRepository $r,bool $write=false):string { $this->start();if($write)SessionSecurity::requireCsrf($this->request,$this->config);return AdminAuthorization::requirePermission($r->db,$write?'inventory.write':'inventory.read');}
 public function mediaGuard(CatalogueRepository $r,bool $write=false):string{
  $this->start();if($write)SessionSecurity::requireCsrf($this->request,$this->config);
  foreach(['catalogue.write','content.write','settings.write']as $permission){try{return AdminAuthorization::requirePermission($r->db,$permission);}catch(HttpError $e){if($e->status!==403)throw $e;}}
  throw new HttpError(403,'FORBIDDEN','Media permission required.');
 }
 public function login(CatalogueRepository $r,array $body):array{
  $this->start();SessionSecurity::requireCsrf($this->request,$this->config);Request::allowFields($body,['email','password']);
  $email=strtolower(CatalogueRules::text($body['email']??null,254,true));$password=$body['password']??null;if(!is_string($password)||strlen($password)<1||strlen($password)>1024)CatalogueRules::fail('Password required.');
  if(!filter_var($email,FILTER_VALIDATE_EMAIL))CatalogueRules::fail('Valid email required.');
  $window=gmdate('Y-m-d H:i:s',(int)(floor(time()/900)*900));
  foreach(['ip:'.($this->request->server['REMOTE_ADDR']??''),'email:'.$email]as $scope){
   $bucket=hash('sha256','admin-login:'.$scope);
   $r->query('INSERT INTO rate_limit_buckets (bucket_hash,window_start,request_count,expires_at) VALUES (?,?,1,DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 30 MINUTE)) ON DUPLICATE KEY UPDATE request_count=request_count+1',[$bucket,$window]);
   if((int)$r->query('SELECT request_count FROM rate_limit_buckets WHERE bucket_hash=? AND window_start=?',[$bucket,$window])->fetchColumn()>10){header('Retry-After: 900');throw new HttpError(429,'RATE_LIMITED','Too many login attempts. Try again later.');}
  }
  $admin=$r->query('SELECT * FROM admin_users WHERE email=?',[$email])->fetch(\PDO::FETCH_ASSOC);
  // Work factor for unknown accounts too; this hash is not an account credential.
  $hash=$admin['password_hash']??password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT);
  if(!password_verify($password,$hash)||!$admin||$admin['status']!=='active')throw new HttpError(401,'INVALID_LOGIN','Invalid email or password.');
  session_regenerate_id(true);$_SESSION=['admin_id'=>$admin['id'],'started'=>time(),'last_seen'=>time()];
  $r->query('UPDATE admin_users SET last_login_at=UTC_TIMESTAMP(6) WHERE id=?',[$admin['id']]);
  return $this->session($r);
 }
 public function logout():array{
  $this->start();SessionSecurity::requireCsrf($this->request,$this->config);$_SESSION=[];session_regenerate_id(true);return ['admin'=>null,'csrfToken'=>SessionSecurity::csrfToken()];
 }
}
