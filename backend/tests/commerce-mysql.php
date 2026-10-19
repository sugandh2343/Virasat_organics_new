<?php
declare(strict_types=1);
// CLI ONLY. Never use a production database. This harness is NOT part of the upload ZIP.
if(PHP_SAPI!=='cli')exit(1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{Configuration,Database,CatalogueRepository,CommerceService,HttpError};
if(getenv('VIRASAT_COMMERCE_TEST_ACK')!=='DISPOSABLE_DATABASE_ONLY'||!in_array($argv[1]??'', ['--disposable-hosted-test-db','--worker'],true)){echo "SKIP: explicit disposable hosted database acknowledgement and flag required.\n";exit(2);}
try{
 $c=Configuration::load(dirname(__DIR__).'/config/commerce-test.php');
 if(!preg_match('/_test$/D',$c['db']['name'])||in_array($c['db']['host'],['localhost','127.0.0.1','::1'],true))throw new RuntimeException('Unsafe test target');
 $c['commerce']['order_acceptance_enabled']=true; // THIS isolated CLI fixture only; config.php is never loaded.
 $r=new CatalogueRepository(Database::connect($c['db']));$service=new CommerceService($r,$c,'synthetic-concurrency');
 if(($argv[1]??'')==='--worker'){
  $task=json_decode(stream_get_contents(STDIN),true,32,JSON_THROW_ON_ERROR);file_put_contents($argv[2].'/ready-'.$argv[3],'ready');$until=time()+20;while(!is_file($argv[2].'/go')){if(time()>$until)throw new RuntimeException('Barrier timeout');usleep(10000);}
  for($attempt=0;$attempt<3;$attempt++){try{$order=$service->place($task['owner'],['quoteId'=>$task['quote'],'paymentMethod'=>'cod'],$task['key']);echo json_encode(['ok'=>true,'id'=>$order['id']]);exit(0);}catch(HttpError $e){if($e->errorCode==='RETRY_TRANSACTION'&&$attempt<2){usleep(20000);continue;}echo json_encode(['ok'=>false,'status'=>$e->status,'code'=>$e->errorCode]);exit(0);}}
 }
 foreach(['customers','orders','checkout_quotes','delivery_zones','inventory_movements']as $table)if((int)$r->query('SELECT COUNT(*) FROM '.$table)->fetchColumn()!==0)throw new RuntimeException('Test schema must have no customer/commerce rows');
 $r->query('SELECT snapshot FROM checkout_quotes LIMIT 0');$old=$r->one("SELECT * FROM delivery_settings WHERE id='delivery-settings'");if($old['configured'])throw new RuntimeException('Test delivery policy must be unconfigured');
 $oldBusiness=$r->one("SELECT accept_orders,maintenance_enabled FROM business_settings WHERE id='business-virasat'");if(!$oldBusiness)throw new RuntimeException('Initialize disposable business settings first');
 $prefix='ct-'.bin2hex(random_bytes(5));$owners=[$prefix.'-a',$prefix.'-b'];$product=$prefix.'-p';$category=$prefix.'-c';$zone=$prefix.'-z';$dir=sys_get_temp_dir().'/'.$prefix;mkdir($dir,0700);
 function runTogether(array $tasks,string $dir):array {
  foreach(glob($dir.'/*')as $f)unlink($f);$processes=[];
  foreach($tasks as $n=>$task){$pipes=[];$proc=proc_open([PHP_BINARY,__FILE__,'--worker',$dir,(string)$n],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);if(!is_resource($proc))throw new RuntimeException('Worker unavailable');fwrite($pipes[0],json_encode($task));fclose($pipes[0]);$processes[]=[$proc,$pipes];}
  try{$until=time()+20;while(count(glob($dir.'/ready-*'))<count($tasks)){if(time()>$until)throw new RuntimeException('Workers did not reach barrier');usleep(10000);}file_put_contents($dir.'/go','go');$results=[];foreach($processes as [$proc,$pipes]){$out=stream_get_contents($pipes[1]);stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);if(proc_close($proc)!==0)throw new RuntimeException('Worker failed');$results[]=json_decode($out,true,32,JSON_THROW_ON_ERROR);}return $results;
  }catch(Throwable $e){foreach($processes as [$proc,$pipes]){if(is_resource($proc))proc_terminate($proc);}throw $e;}
 }
 try{
  $r->query("UPDATE business_settings SET accept_orders=1,maintenance_enabled=0 WHERE id='business-virasat'");
  $r->insert('categories',['id'=>$category,'slug'=>$category,'name'=>'Synthetic test only','status'=>'active']);$r->insert('products',['id'=>$product,'slug'=>$product,'sku'=>$product,'name'=>'Synthetic test only','size'=>'test','status'=>'active','category_id'=>$category,'price_paise'=>100,'ingredients'=>'[]','specifications'=>'{}','keywords'=>'[]']);$r->insert('inventory_balances',['product_id'=>$product,'on_hand'=>1]);
  foreach($owners as $i=>$owner){$r->insert('customers',['id'=>$owner,'firebase_uid'=>$owner,'phone_e164'=>'+91900000000'.$i,'phone_verified_at'=>gmdate('Y-m-d H:i:s'),'status'=>'active']);$r->insert('addresses',['id'=>$owner.'-address','customer_id'=>$owner,'label'=>'Home','recipient'=>'Synthetic','phone_e164'=>'+91900000000'.$i,'building'=>'Test','street'=>'Test','locality'=>'Test','city'=>'Test','state'=>'Test','postal_code'=>'110001','country_code'=>'IN']);}
  $r->query("UPDATE delivery_settings SET configured=1,cod_enabled=1,default_shipping_paise=0,minimum_order_paise=0,free_shipping_threshold_paise=NULL,tax_mode='none',tax_basis_points=0,tax_shipping=0,tax_policy_version='synthetic-only',maximum_distance_m=NULL,version=version+1 WHERE id='delivery-settings'");
  $r->insert('delivery_zones',['id'=>$zone,'name'=>'Synthetic test only','status'=>'active','cod_enabled'=>1]);$r->insert('delivery_zone_pins',['postal_code'=>'110001','zone_id'=>$zone]);
  $tasks=[];foreach($owners as $owner){$q=$service->quote($owner,['addressId'=>$owner.'-address','items'=>[['productId'=>$product,'quantity'=>1]],'paymentMethod'=>'cod']);$tasks[]=['owner'=>$owner,'quote'=>$q['id'],'key'=>$owner.'-request'];}
  $results=runTogether($tasks,$dir);$success=array_values(array_filter($results,fn($v)=>$v['ok']));if(count($success)!==1||(int)$r->query('SELECT on_hand FROM inventory_balances WHERE product_id=?',[$product])->fetchColumn()!==0)throw new RuntimeException('Overselling test failed');
  $losers=array_values(array_filter($results,fn($v)=>!$v['ok']));if(!in_array($losers[0]['code'],['INSUFFICIENT_STOCK','RETRY_TRANSACTION'],true))throw new RuntimeException('Unexpected concurrency error');
  $r->query('UPDATE inventory_balances SET on_hand=1 WHERE product_id=?',[$product]);$owner=$owners[0];$q=$service->quote($owner,['addressId'=>$owner.'-address','items'=>[['productId'=>$product,'quantity'=>1]],'paymentMethod'=>'cod']);$task=['owner'=>$owner,'quote'=>$q['id'],'key'=>$prefix.'-duplicate-request'];$results=runTogether([$task,$task],$dir);
  if(!$results[0]['ok']||!$results[1]['ok']||$results[0]['id']!==$results[1]['id']||(int)$r->query('SELECT on_hand FROM inventory_balances WHERE product_id=?',[$product])->fetchColumn()!==0)throw new RuntimeException('Concurrent replay test failed');
  echo "PASS: simultaneous last-stock competition and duplicate-key replay on isolated hosted MySQL.\n";
 }finally{
  // Delete only this test's records in FK-safe order; never truncate tables.
  $r->db->beginTransaction();try{
   $r->query('UPDATE checkout_quotes SET consumed_order_id=NULL WHERE customer_id IN (?,?)',$owners);
   $ids=$r->query('SELECT id FROM orders WHERE customer_id IN (?,?)',$owners)->fetchAll(PDO::FETCH_COLUMN);
   foreach($ids as $id){foreach(['payments','order_notes','order_status_events','inventory_movements','order_items']as $table)$r->query('DELETE FROM '.$table.' WHERE order_id=?',[$id]);$r->query("DELETE FROM audit_logs WHERE resource_type='order' AND resource_id=?",[$id]);$r->query('DELETE FROM orders WHERE id=?',[$id]);}
   foreach($r->query('SELECT id FROM checkout_quotes WHERE customer_id IN (?,?)',$owners)->fetchAll(PDO::FETCH_COLUMN)as $id){$r->query('DELETE FROM quote_items WHERE quote_id=?',[$id]);$r->query('DELETE FROM checkout_quotes WHERE id=?',[$id]);}
   foreach($owners as $owner){$r->query('DELETE FROM addresses WHERE customer_id=?',[$owner]);$r->query('DELETE FROM customers WHERE id=?',[$owner]);}
   $r->query('DELETE FROM inventory_balances WHERE product_id=?',[$product]);$r->query('DELETE FROM products WHERE id=?',[$product]);$r->query('DELETE FROM categories WHERE id=?',[$category]);$r->query('DELETE FROM delivery_zone_pins WHERE zone_id=?',[$zone]);$r->query('DELETE FROM delivery_zones WHERE id=?',[$zone]);
   $r->query("UPDATE business_settings SET accept_orders=?,maintenance_enabled=? WHERE id='business-virasat'",[$oldBusiness['accept_orders'],$oldBusiness['maintenance_enabled']]);
   $columns=array_keys($old);$r->query('UPDATE delivery_settings SET '.implode(',',array_map(fn($k)=>$k.'=?',$columns))." WHERE id='delivery-settings'",array_values($old));$r->db->commit();
  }catch(Throwable $e){if($r->db->inTransaction())$r->db->rollBack();throw new RuntimeException('Fixture cleanup failed; inspect disposable test database.');}
  foreach(glob($dir.'/*')as $f)unlink($f);rmdir($dir);
 }
}catch(Throwable $e){fwrite(STDERR,"FAIL: isolated commerce test did not complete. Review disposable test setup; no secrets are printed.\n");exit(1);}
