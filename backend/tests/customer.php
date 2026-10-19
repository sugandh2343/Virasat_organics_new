<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
// Offline tests only. Synthetic RSA credentials remain in memory and are never printed.
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{FirebaseIdentity,CustomerAccounts,CustomerSecurity,CatalogueRepository,Request,HttpError,SessionSecurity};
$count=0;
function check(bool $ok):void {global $count;$count++;if(!$ok)throw new RuntimeException('Check failed #'.$count);}
function denied(callable $fn,int $status):void {try{$fn();}catch(HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected safe rejection.');}
$options=['private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA];
if(getenv('OPENSSL_CONF'))$options['config']=getenv('OPENSSL_CONF');
$key=openssl_pkey_new($options);$csr=openssl_csr_new(['commonName'=>'synthetic.invalid'],$key,$options);$cert=openssl_csr_sign($csr,null,$key,1,$options);openssl_x509_export($cert,$pem);
function encoded($value):string{return rtrim(strtr(base64_encode(is_string($value)?$value:json_encode($value)),'+/','-_'),'=');}
function token(array $claims,array $header=[]):string {global $key;$s=encoded($header?:['alg'=>'RS256','kid'=>'synthetic']).'.'.encoded($claims);openssl_sign($s,$signature,$key,OPENSSL_ALGO_SHA256);return $s.'.'.encoded($signature);}
$now=time();$claims=['sub'=>'synthetic-uid','aud'=>'synthetic-project','iss'=>'https://securetoken.google.com/synthetic-project','iat'=>$now,'auth_time'=>$now,'exp'=>$now+3600,'phone_number'=>'+919876543210','firebase'=>['sign_in_provider'=>'phone','identities'=>['phone'=>['+919876543210']]]];
$keys=['synthetic'=>$pem];check(FirebaseIdentity::verify(token($claims),'synthetic-project',$keys)['uid']==='synthetic-uid');
foreach([['aud'=>'wrong-project'],['iss'=>'wrong'],['exp'=>$now-1],['iat'=>$now+90],['auth_time'=>$now-301],['sub'=>''],['sub'=>str_repeat('x',129)],['phone_number'=>'+12025550123'],['firebase'=>['sign_in_provider'=>'password']],['firebase'=>['sign_in_provider'=>'phone','identities'=>['phone'=>['+919999999999']]]]]as $patch)denied(fn()=>FirebaseIdentity::verify(token(array_replace($claims,$patch)),'synthetic-project',$keys),401);
denied(fn()=>FirebaseIdentity::verify(token($claims,['alg'=>'none','kid'=>'synthetic']),'synthetic-project',$keys),401);
denied(fn()=>FirebaseIdentity::verify(token($claims,['alg'=>'RS256','kid'=>'unknown']),'synthetic-project',$keys),401);
$parts=explode('.',token($claims));$parts[1]=encoded(array_replace($claims,['sub'=>'forged']));denied(fn()=>FirebaseIdentity::verify(implode('.',$parts),'synthetic-project',$keys),401);

denied(fn()=>FirebaseIdentity::configuredProject([]),503);
$valid=['type'=>'Home','recipient'=>'Synthetic Recipient','phone'=>'9876543210','line1'=>'Synthetic House','line2'=>'Synthetic Street','locality'=>'Synthetic Locality','city'=>'Synthetic City','state'=>'Synthetic State','postalCode'=>'110001'];
check(CustomerAccounts::addressInput($valid)['latitude']===null);
foreach([['postalCode'=>'000000'],['phone'=>'123'],['country'=>'US'],['latitude'=>1],['latitude'=>91,'longitude'=>1,'coordinatesConfirmed'=>true],['coordinatesConfirmed'=>true],['customerId'=>'foreign']]as $patch)denied(fn()=>CustomerAccounts::addressInput(array_replace($valid,$patch)),422);
check(CustomerAccounts::addressInput($valid+['latitude'=>0,'longitude'=>0,'coordinatesConfirmed'=>true])['latitude']===0);

// SQLite executes repository logic offline; shim translates only MySQL syntax.
// This does NOT claim MySQL locking/concurrency or live Hostinger integration.
class OfflinePDO extends PDO {
 public function __construct(){parent::__construct('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);}
 public function prepare($sql,$options=[]):PDOStatement|false {
  $sql=str_replace([' FOR UPDATE','UTC_TIMESTAMP(6)',"DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 1 DAY)"],['',"datetime('now')","datetime('now','+1 day')"],$sql);
  $sql=str_replace("DATE_ADD(datetime('now'),INTERVAL 1 DAY)","datetime('now','+1 day')",$sql);
  $sql=str_replace('ON DUPLICATE KEY UPDATE product_id=VALUES(product_id)','ON CONFLICT(customer_id,product_id) DO NOTHING',$sql);
  return parent::prepare($sql,$options);
 }
}
$db=new OfflinePDO();
$db->exec("CREATE TABLE customers(id TEXT PRIMARY KEY,firebase_uid TEXT UNIQUE,phone_e164 TEXT UNIQUE,name TEXT,email TEXT,phone_verified_at TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,version INTEGER DEFAULT 1,default_address_id TEXT);
CREATE TABLE addresses(id TEXT PRIMARY KEY,customer_id TEXT,label TEXT,recipient TEXT,phone_e164 TEXT,building TEXT,street TEXT,locality TEXT,city TEXT,state TEXT,postal_code TEXT,country_code TEXT,landmark TEXT,instructions TEXT,latitude REAL,longitude REAL,coordinates_confirmed INTEGER,deleted_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,version INTEGER DEFAULT 1);
CREATE TABLE products(id TEXT PRIMARY KEY,status TEXT);
CREATE TABLE wishlist_items(customer_id TEXT,product_id TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(customer_id,product_id));
CREATE TABLE idempotency_keys(id TEXT NOT NULL PRIMARY KEY,actor_scope TEXT,method TEXT,path_hash TEXT,key_value TEXT,request_hash TEXT,status TEXT CHECK(status IN ('pending','complete')),result_status INTEGER,result_json TEXT,expires_at TEXT,UNIQUE(actor_scope,method,path_hash,key_value));");
$repo=new CatalogueRepository($db);$service=new CustomerAccounts($repo);
$a=$service->login(['uid'=>'one','phone'=>'+919876543210']);$b=$service->login(['uid'=>'two','phone'=>'+919876543211']);check($a['id']!==$b['id']);
check($service->login(['uid'=>'one','phone'=>'+919876543210'])['id']===$a['id']);
denied(fn()=>$service->login(['uid'=>'conflict','phone'=>'+919876543210']),409);denied(fn()=>$service->login(['uid'=>'one','phone'=>'+919876543212']),409);
$repo->query("UPDATE customers SET status='disabled' WHERE id=?",[$b['id']]);denied(fn()=>$service->login(['uid'=>'two','phone'=>'+919876543211']),403);
function requestFor(int $version=1,string $key='synthetic-address-key'):Request{return new Request(['REQUEST_METHOD'=>'PATCH','HTTP_IF_MATCH'=>(string)$version,'HTTP_IDEMPOTENCY_KEY'=>$key]);}
$profile=$service->saveProfile($a['id'],['name'=>'Synthetic Name','email'=>'synthetic@example.invalid'],requestFor());check($profile['version']===2);
denied(fn()=>$service->saveProfile($a['id'],['mobile'=>'9999999999'],requestFor(2)),422);
denied(fn()=>$service->saveProfile($a['id'],['name'=>'stale'],requestFor()),409);
$list=$service->saveAddress($a['id'],null,$valid,requestFor());check(count($list)===1&&$list[0]['isDefault']);$first=$list[0]['id'];
check(count($service->saveAddress($a['id'],null,$valid,requestFor()))===1);
denied(fn()=>$service->saveAddress($a['id'],null,$valid+['landmark'=>'changed'],requestFor()),409);
$list=$service->saveAddress($a['id'],null,$valid,requestFor(1,'synthetic-second-key'));check(count($list)===2);$second=array_values(array_filter($list,fn($r)=>$r['id']!==$first))[0]['id'];
denied(fn()=>$service->saveAddress($b['id'],$first,['isDefault'=>true],requestFor()),404);
$list=$service->saveAddress($a['id'],$second,['isDefault'=>true],requestFor());check(count(array_filter($list,fn($r)=>$r['isDefault']))===1);
$list=$service->saveAddress($a['id'],$second,[],requestFor(2),true);check(count($list)===1&&$list[0]['id']===$first&&$list[0]['isDefault']);
denied(fn()=>$service->saveAddress($a['id'],$first,['postalCode'=>'bad'],requestFor()),422);check(count($service->addresses($a['id']))===1); // rollback
foreach(['active','inactive','out_of_stock','coming_soon']as $status)$repo->insert('products',['id'=>$status,'status'=>$status]);
foreach(['active','out_of_stock','coming_soon']as $id)$service->saveWishlist($a['id'],$id,false);
check(count($service->saveWishlist($a['id'],'active',false))===3);denied(fn()=>$service->saveWishlist($a['id'],'inactive',false),404);
check($service->wishlist($b['id'])===[]);$service->saveWishlist($b['id'],'active',true);check(count($service->wishlist($a['id']))===3);
$repo->query("UPDATE products SET status='inactive' WHERE id='active'");check(count($service->wishlist($a['id']))===2);

$dir=sys_get_temp_dir().'/virasat-customer-test-'.bin2hex(random_bytes(8));mkdir($dir,0700);
$config=['session'=>['name'=>'__Host-virasat_session','path'=>$dir,'idle_seconds'=>1800,'absolute_seconds'=>43200],'trusted_proxies'=>[],'app_origin'=>'https://virasatorganics.com'];
$request=new Request(['HTTPS'=>'on','HTTP_ORIGIN'=>'https://virasatorganics.com']);
try{
 SessionSecurity::start($request,$config);$_SESSION['admin_id']='synthetic-admin';session_write_close();session_id('');
 CustomerSecurity::start($request,$config);check(session_name()==='__Host-virasat_customer');check(!isset($_SESSION['admin_id']));
 $_SESSION=['admin_id'=>'synthetic-admin'];denied(fn()=>CustomerSecurity::owner($repo),401);
 $_SESSION=['customer_id'=>$a['id']];check(CustomerSecurity::owner($repo)['id']===$a['id']);
 $csrf=SessionSecurity::csrfToken();denied(fn()=>SessionSecurity::requireCsrf($request,$config),403);
 SessionSecurity::requireCsrf(new Request(['HTTP_ORIGIN'=>$config['app_origin'],'HTTP_X_CSRF_TOKEN'=>$csrf]),$config);check(true);
 denied(fn()=>SessionSecurity::requireCsrf(new Request(['HTTP_ORIGIN'=>'https://evil.invalid','HTTP_X_CSRF_TOKEN'=>$csrf]),$config),403);
 $_SESSION=[];session_destroy();
}finally{if(session_status()===PHP_SESSION_ACTIVE){$_SESSION=[];session_destroy();}foreach(glob($dir.'/sess_*')as $file)unlink($file);rmdir($dir);}
echo 'PASS: '.$count." offline customer checks: signed/forged/expired/wrong-project tokens, phone identity, profile, ownership, address rollback/default/idempotency, wishlist, CSRF and isolated sessions. SQLite is not MySQL concurrency validation.\n";
