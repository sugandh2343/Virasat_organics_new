<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{CatalogueRepository,CommerceRules,DeliveryService,CommerceService,CustomerAccounts,CustomerSecurity,SessionSecurity,AdminAuthorization,CommerceController,Request,Router,HttpError};
$count=0;
function check($v){global $count;if(!$v)throw new RuntimeException('Assertion '.($count+1).' failed');$count++;}
function deny(callable $fn,int $status,?string $code=null){try{$fn();}catch(HttpError $e){check($e->status===$status&&($code===null||$e->errorCode===$code));return;}throw new RuntimeException('Expected rejection '.$status.' '.$code);}
class CommerceTestPDO extends PDO {
 public function __construct(){parent::__construct('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);}
 public function prepare($sql,$options=[]):PDOStatement|false{return parent::prepare(str_replace([' FOR UPDATE','UTC_TIMESTAMP(6)','on_hand-reserved>=?'],['',"strftime('%Y-%m-%d %H:%M:%f','now')",'on_hand-reserved>=CAST(? AS INTEGER)'],$sql),$options);}
}
$db=new CommerceTestPDO();$manifest=json_decode(file_get_contents(dirname(__DIR__).'/database/manifest.json'),true);
// Build isolated fixture tables from the checked-in schema, never from production credentials.
foreach($manifest['tables'] as $name=>$table){$columns=[];foreach($table['columns']as $column=>$definition){$definition=preg_replace('/CHARACTER SET \w+|COLLATE \w+/','',$definition);$definition=str_replace('CURRENT_TIMESTAMP(6)','CURRENT_TIMESTAMP',$definition);$columns[]=$column.' '.$definition;}$db->exec('CREATE TABLE '.$name.' ('.implode(',',$columns).')');}
foreach(['delivery_settings'=>['tax_mode TEXT','tax_basis_points INTEGER','tax_shipping INTEGER DEFAULT 0','maximum_distance_m INTEGER'],'delivery_zones'=>['estimate_min_days INTEGER','estimate_max_days INTEGER'],'delivery_zone_pins'=>['latitude REAL','longitude REAL','coverage_radius_m INTEGER'],'checkout_quotes'=>['snapshot TEXT'],'orders'=>['request_hash TEXT']]as $table=>$columns)foreach($columns as $column)$db->exec('ALTER TABLE '.$table.' ADD COLUMN '.$column);
$db->exec('CREATE UNIQUE INDEX request_once ON orders(customer_id,idempotency_key); CREATE UNIQUE INDEX quote_once ON orders(quote_id); CREATE UNIQUE INDEX movement_once ON inventory_movements(idempotency_key,product_id,kind); CREATE UNIQUE INDEX pin_once ON delivery_zone_pins(postal_code);');
$r=new CatalogueRepository($db);$off=new CommerceService($r,[]);$on=new CommerceService($r,['commerce'=>['order_acceptance_enabled'=>true]]);$d=new DeliveryService($r);
$r->insert('customers',['id'=>'alice','firebase_uid'=>'synthetic-alice','phone_e164'=>'+919876543210','phone_verified_at'=>'2026-01-01','status'=>'active']);$r->insert('customers',['id'=>'bob','firebase_uid'=>'synthetic-bob','phone_e164'=>'+919876543211','phone_verified_at'=>'2026-01-01','status'=>'active']);
$r->insert('addresses',['id'=>'address-a','customer_id'=>'alice','label'=>'Home','recipient'=>'Synthetic','phone_e164'=>'+919876543210','building'=>'Synthetic','street'=>'Test','locality'=>'Test','city'=>'Test','state'=>'Test','postal_code'=>'110001','country_code'=>'IN','coordinates_confirmed'=>0]);
$r->insert('categories',['id'=>'category','slug'=>'synthetic','name'=>'Synthetic','status'=>'active']);
$r->insert('products',['id'=>'product','slug'=>'synthetic-product','sku'=>'SYNTHETIC','name'=>'Synthetic','size'=>'1 unit','category_id'=>'category','status'=>'active','price_paise'=>10000,'ingredients'=>'[]','nutrition'=>'[]','specifications'=>'{}','keywords'=>'[]']);$r->insert('inventory_balances',['product_id'=>'product','on_hand'=>10]);
$r->insert('business_settings',['id'=>'business-virasat','name'=>'Synthetic','accept_orders'=>1]);
$r->insert('delivery_settings',['id'=>'delivery-settings']);
$r->insert('delivery_zones',['id'=>'zone','name'=>'Synthetic zone','status'=>'active','shipping_paise'=>500,'minimum_order_paise'=>0,'cod_enabled'=>1]);$r->insert('delivery_zone_pins',['postal_code'=>'110001','zone_id'=>'zone']);
$body=['addressId'=>'address-a','items'=>[['productId'=>'product','quantity'=>2]],'paymentMethod'=>'cod'];
check(!CommerceRules::enabled([]));deny(fn()=>$on->quote('alice',$body),422,'UNCONFIGURED');
$r->query("UPDATE delivery_settings SET configured=1,cod_enabled=1,tax_mode='exclusive_bps',tax_basis_points=500,tax_shipping=1,tax_policy_version='synthetic-only',default_shipping_paise=500,minimum_order_paise=0");
deny(fn()=>$on->quote('bob',$body),404);deny(fn()=>$on->quote('alice',$body+['totalPaise'=>1]),422);deny(fn()=>CommerceRules::items([['productId'=>'product','quantity'=>1,'price'=>0]]),422);
foreach([0,-1,1.5,'2',10001]as $quantity)deny(fn()=>CommerceRules::items([['productId'=>'product','quantity'=>$quantity]]),422);
deny(fn()=>CommerceRules::items([['productId'=>'product','quantity'=>1],['productId'=>'product','quantity'=>1]]),422);deny(fn()=>CommerceRules::id("x' OR 1=1 --"),422);deny(fn()=>$d->evaluate('bad'),422,'INVALID_PIN');deny(fn()=>$d->evaluate('999999'),422,'DELIVERY_UNAVAILABLE');
$q=$on->quote('alice',$body);check($q['subtotalPaise']===20000&&$q['shippingPaise']===500&&$q['taxPaise']===1025&&$q['totalPaise']===21525);
$orderBody=['quoteId'=>$q['id'],'paymentMethod'=>'cod'];deny(fn()=>$off->place('alice',$orderBody,'synthetic-request-001'),503,'ORDER_ACCEPTANCE_DISABLED');deny(fn()=>$on->place('bob',$orderBody,'synthetic-request-bob'),404);deny(fn()=>$on->place('alice',$orderBody,''),428);deny(fn()=>$on->place('alice',$orderBody+['role'=>'admin'],'synthetic-request-001'),422);
foreach(['inactive','out_of_stock','coming_soon']as $status){$r->query('UPDATE products SET status=?',[$status]);deny(fn()=>$on->quote('alice',$body),422,'NOT_PURCHASABLE');}$r->query("UPDATE products SET status='active',price_paise=NULL");deny(fn()=>$on->quote('alice',$body),422,'NOT_PURCHASABLE');$r->query('UPDATE products SET price_paise=10000');
$r->query('UPDATE inventory_balances SET on_hand=1');deny(fn()=>$on->quote('alice',$body),422,'INSUFFICIENT_STOCK');$r->query('UPDATE inventory_balances SET on_hand=10');
$r->query('UPDATE addresses SET version=2');deny(fn()=>$on->place('alice',$orderBody,'synthetic-request-001'),409,'QUOTE_STALE');$r->query('UPDATE addresses SET version=1');
$r->query("UPDATE checkout_quotes SET expires_at='2000-01-01 00:00:00' WHERE id=?",[$q['id']]);deny(fn()=>$on->place('alice',$orderBody,'synthetic-request-001'),409,'QUOTE_EXPIRED');
$q=$on->quote('alice',$body);$orderBody['quoteId']=$q['id'];
// Inject failure AFTER order/item creation and stock deduction: all must roll back.
$db->exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'synthetic fault'); END;");
try{$on->place('alice',$orderBody,'synthetic-request-001');throw new RuntimeException('Expected injected failure');}catch(PDOException $e){check(true);}catch(HttpError $e){check($e->status===409&&$e->errorCode==='RECORD_CONFLICT');}
check((int)$r->query('SELECT COUNT(*) FROM orders')->fetchColumn()===0);check((int)$r->query('SELECT on_hand FROM inventory_balances')->fetchColumn()===10);check((int)$r->query('SELECT COUNT(*) FROM inventory_movements')->fetchColumn()===0);$db->exec('DROP TRIGGER fail_audit');
$o=$on->place('alice',$orderBody,'synthetic-request-001');check($o['paymentStatus']==='pending'&&$o['status']==='placed');check((int)$r->query('SELECT on_hand FROM inventory_balances')->fetchColumn()===8);
check($on->place('alice',$orderBody,'synthetic-request-001')['id']===$o['id']);deny(fn()=>$on->place('alice',$orderBody+['deliveryInstructions'=>'changed'],'synthetic-request-001'),409,'IDEMPOTENCY_CONFLICT');deny(fn()=>$on->place('alice',$orderBody,'synthetic-request-002'),409,'QUOTE_CONSUMED');
deny(fn()=>$on->order($o['id'],'bob'),404);check($on->listing('bob',[])['data']===[]);check(!isset($on->order($o['id'],'alice')['internalNotes']));
function req(int $version=1):Request{return new Request(['HTTP_IF_MATCH'=>(string)$version]);}
deny(fn()=>$on->change($o['id'],[],req(),'bob'),404);deny(fn()=>$on->change($o['id'],['status'=>'delivered'],req(),null,'admin'),409,'INVALID_TRANSITION');deny(fn()=>$on->change($o['id'],[],new Request([]),'alice'),428);
$cancelled=$on->change($o['id'],[],req(),'alice');check($cancelled['status']==='cancelled');check((int)$r->query('SELECT on_hand FROM inventory_balances')->fetchColumn()===10);$on->change($o['id'],[],req(),'alice');check((int)$r->query("SELECT COUNT(*) FROM inventory_movements WHERE kind='restock'")->fetchColumn()===1);deny(fn()=>$on->change($o['id'],['status'=>'confirmed'],req(2),null,'admin'),409);
// Two competing quotes for last stock. This is sequential conflict testing, not MySQL concurrency proof.
$r->query('UPDATE inventory_balances SET on_hand=1');$one=$body;$one['items'][0]['quantity']=1;$first=$on->quote('alice',$one);$second=$on->quote('alice',$one);$placed=$on->place('alice',['quoteId'=>$first['id'],'paymentMethod'=>'cod'],'synthetic-last-stock-a');deny(fn()=>$on->place('alice',['quoteId'=>$second['id'],'paymentMethod'=>'cod'],'synthetic-last-stock-b'),422,'INSUFFICIENT_STOCK');
foreach(['confirmed','packed','shipped','out_for_delivery','delivered']as $target){$placed=$on->change($placed['id'],['status'=>$target,'internalNote'=>'Synthetic internal note'],req($placed['version']),null,'admin');}check($placed['paymentStatus']==='pending');check(count($placed['statusEvents'])===6);check(count($placed['internalNotes'])===5);check(!isset($on->order($placed['id'],'alice')['internalNotes']));deny(fn()=>$on->change($placed['id'],[],req($placed['version']),'alice'),409);
$r->query('UPDATE delivery_zones SET free_shipping_threshold_paise=10000');check($d->evaluate('110001',10000)['shippingPaise']===0);$r->query('UPDATE delivery_zones SET minimum_order_paise=20000');deny(fn()=>$d->evaluate('110001',10000),422,'MINIMUM_ORDER');
$r->query('UPDATE delivery_settings SET maximum_distance_m=1000');deny(fn()=>$d->evaluate('110001'),422,'UNCONFIGURED');$r->query('UPDATE delivery_settings SET origin_address=?',[json_encode(['latitude'=>0,'longitude'=>0])]);$r->query('UPDATE delivery_zone_pins SET latitude=0,longitude=0,coverage_radius_m=500');check($d->evaluate('110001')['serviceable']);$r->query('UPDATE delivery_zone_pins SET coverage_radius_m=1500');deny(fn()=>$d->evaluate('110001'),422,'DELIVERY_UNAVAILABLE');
check(CommerceRules::tax(101,'exclusive_bps',500)===5);deny(fn()=>CommerceRules::sum(CommerceRules::MAX_MONEY,1),422);deny(fn()=>CommerceRules::line(CommerceRules::MAX_MONEY,2),422);
// Route inventory and anonymous boundary do not require a database connection.
foreach(['/api/checkout/quote'=>'POST','/api/orders'=>'POST','/api/me/orders'=>'GET','/api/admin/orders'=>'GET','/api/admin/delivery/settings'=>'PATCH']as $path=>$method){$router=new Router();$request=new Request(['REQUEST_URI'=>$path,'REQUEST_METHOD'=>$method]);(new CommerceController([],$request,'synthetic'))->register($router);check(in_array($method,$router->methods($path),true));}


$settingsBody=$d->view()['settings'];$settingsVersion=$settingsBody['version'];unset($settingsBody['version']);
deny(fn()=>$on->transaction(fn()=>$d->saveSettings($settingsBody,req(999))),409,'VERSION_CONFLICT');
deny(fn()=>$on->transaction(fn()=>$d->saveSettings($settingsBody+['orderAcceptanceEnabled'=>true],req($settingsVersion))),422);
$updated=$on->transaction(fn()=>$d->saveSettings($settingsBody,req($settingsVersion)));check($updated['settings']['version']===$settingsVersion+1);
$zoneBody=['name'=>'Another synthetic zone','status'=>'active','codEnabled'=>true,'pins'=>[['postalCode'=>'110001']]];
deny(fn()=>$on->transaction(fn()=>$d->saveZone($zoneBody,null,req())),409,'PIN_CONFLICT');check(count($d->view()['zones'])===1);
$zoneBody['pins']=[['postalCode'=>'110002']];$new=$on->transaction(fn()=>$d->saveZone($zoneBody,null,req()));check(count($new['zones'])===2);
deny(fn()=>CommerceRules::tax(100,'none',null),422);deny(fn()=>$on->order("' OR 1=1 --",'alice'),404);deny(fn()=>$on->listing('alice',['status'=>"' OR 1=1 --"]),422);
$r->query("UPDATE customers SET phone_verified_at=NULL WHERE id='bob'");deny(fn()=>$on->quote('bob',$body),401);
$dir=sys_get_temp_dir().'/virasat-commerce-'.bin2hex(random_bytes(8));mkdir($dir,0700);
$config=['session'=>['name'=>'__Host-virasat_session','path'=>$dir,'idle_seconds'=>1800,'absolute_seconds'=>3600],'trusted_proxies'=>[],'app_origin'=>'https://virasatorganics.com'];
try{
 SessionSecurity::start(new Request(['HTTPS'=>'on']),$config);$_SESSION=[];
 deny(fn()=>AdminAuthorization::requirePermission($db,'orders.manage'),401);
 $r->insert('admin_users',['id'=>'admin','email'=>'synthetic@example.invalid','name'=>'Synthetic','password_hash'=>'unused-test-only','status'=>'active']);
 $_SESSION['admin_id']='admin';deny(fn()=>AdminAuthorization::requirePermission($db,'orders.manage'),403);
 $r->insert('admin_roles',['id'=>'role','role_key'=>'test','name'=>'Test']);$r->insert('admin_user_roles',['admin_user_id'=>'admin','role_id'=>'role']);$r->insert('admin_role_permissions',['role_id'=>'role','permission_key'=>'catalogue.write']);
 deny(fn()=>AdminAuthorization::requirePermission($db,'orders.manage'),403);deny(fn()=>AdminAuthorization::requirePermission($db,'settings.write'),403);
 $r->insert('admin_role_permissions',['role_id'=>'role','permission_key'=>'orders.manage']);check(AdminAuthorization::requirePermission($db,'orders.manage')==='admin');
 $token=SessionSecurity::csrfToken();deny(fn()=>SessionSecurity::requireCsrf(new Request(['HTTP_ORIGIN'=>$config['app_origin']]),$config),403);deny(fn()=>SessionSecurity::requireCsrf(new Request(['HTTP_ORIGIN'=>'https://evil.invalid','HTTP_X_CSRF_TOKEN'=>$token]),$config),403);
 SessionSecurity::requireCsrf(new Request(['HTTP_ORIGIN'=>$config['app_origin'],'HTTP_X_CSRF_TOKEN'=>$token]),$config);check(true);
 $_SESSION=[];deny(fn()=>CustomerSecurity::owner($r),401);
}finally{if(session_status()===PHP_SESSION_ACTIVE){$_SESSION=[];session_destroy();}foreach(glob($dir.'/sess_*')as $f)unlink($f);rmdir($dir);}
echo 'PASS: '.$count." offline commerce assertions; synthetic SQLite only. MySQL simultaneous-lock behavior and live customer acceptance are NOT verified.\n";
