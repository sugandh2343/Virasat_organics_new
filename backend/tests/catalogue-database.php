<?php
declare(strict_types=1);
// Opt-in integration tests on a disposable HOSTED test database only.
// No local database/server is started. Never run against the live shop database.
if(PHP_SAPI!=='cli')exit(1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{Configuration,Database,CatalogueRepository,CatalogueAdmin,Request,HttpError};
if(($argv[1]??'')!=='--disposable-hosted-test-db'){fwrite(STDERR,"SKIP: explicit disposable hosted test database required.\n");exit(2);}
$c=Configuration::load(dirname(__DIR__).'/config/test.php');
if(!preg_match('/_test$/D',$c['db']['name'])||in_array($c['db']['host'],['localhost','127.0.0.1','::1'],true))throw new RuntimeException('Hosted database name must end _test; live/local databases forbidden.');
$r=new CatalogueRepository(Database::connect($c['db']));$actor='test-'.CatalogueRepository::id();
$r->insert('admin_users',['id'=>$actor,'email'=>$actor.'@example.invalid','name'=>'Integration fixture','password_hash'=>password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),'status'=>'active']);
$r->insert('admin_roles',['id'=>$actor,'role_key'=>$actor,'name'=>'Synthetic inventory role']);$r->insert('admin_user_roles',['admin_user_id'=>$actor,'role_id'=>$actor]);$r->insert('admin_role_permissions',['role_id'=>$actor,'permission_key'=>'inventory.write']);
function service(string $method,string $path,?int $version=null,?string $key=null):CatalogueAdmin{
 global $r,$actor;
 return new CatalogueAdmin($r,$actor,CatalogueRepository::id(),new Request(['REQUEST_METHOD'=>$method,'REQUEST_URI'=>$path,'HTTP_IF_MATCH'=>$version===null?'':(string)$version,'HTTP_IDEMPOTENCY_KEY'=>$key??CatalogueRepository::id()]));
}
function failure(callable $fn,int $status):void{try{$fn();}catch(HttpError $e){if($e->status===$status)return;throw $e;}throw new RuntimeException('Expected '.$status);}
function check(bool $v):void{if(!$v)throw new RuntimeException('Assertion failed');}
$cat=['name'=>'Integration category','slug'=>'test-'.CatalogueRepository::id(),'status'=>'active','sortOrder'=>0];
$s=service('POST','/api/admin/categories');$category=$s->transaction($cat,fn()=>$s->saveCategory($cat,null));
$input=['name'=>'Integration pack','slug'=>'test-'.CatalogueRepository::id(),'sku'=>'TEST-'.CatalogueRepository::id(),'size'=>'1 L','categoryId'=>$category['id'],'status'=>'coming_soon'];
$s=service('POST','/api/admin/products');$product=$s->transaction($input,fn()=>$s->saveProduct($input,null));
check($product['stock']===null&&$product['pricePaise']===null);
$s=service('POST','/api/admin/products');failure(fn()=>$s->transaction($input,fn()=>$s->saveProduct($input,null)),409);
$s=service('DELETE','/api/admin/categories/'.$category['id'],$category['version']);failure(fn()=>$s->transaction([],fn()=>$s->deleteCategory($category['id'])),409);
$patch=['status'=>'inactive'];$s=service('PATCH','/api/admin/products/'.$product['id'],$product['version']);$product=$s->transaction($patch,fn()=>$s->saveProduct($patch,$product['id']));
failure(fn()=>$r->getProduct($product['slug']),404);
$s=service('PATCH','/api/admin/products/'.$product['id'],1);failure(fn()=>$s->transaction($patch,fn()=>$s->saveProduct($patch,$product['id'])),409);
$adjust=['productId'=>$product['id'],'mode'=>'set','amount'=>4,'reason'=>'Integration test only'];$key=CatalogueRepository::id();
$s=service('POST','/api/admin/inventory/adjustments',$product['version'],$key);$product=$s->transaction($adjust,fn()=>$s->adjust($adjust));$again=$s->transaction($adjust,fn()=>$s->adjust($adjust));check($again['stock']===4);
$s=service('POST','/api/admin/inventory/adjustments',$product['version']);$negative=array_replace($adjust,['mode'=>'adjust','amount'=>-5]);failure(fn()=>$s->transaction($negative,fn()=>$s->adjust($negative)),422);
check((int)$r->query('SELECT COUNT(*) FROM inventory_movements WHERE product_id=?',[$product['id']])->fetchColumn()===1);
check((int)$r->query('SELECT COUNT(*) FROM audit_logs WHERE actor_admin_id=?',[$actor])->fetchColumn()>=4);
echo "PASS: database category/product creation, duplicate rejection, reference deletion guard, inactive lookup, stale versions, idempotent stock, negative rejection and audit. Fixtures retained in disposable test DB.\n";
