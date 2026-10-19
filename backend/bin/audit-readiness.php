<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{Configuration,Database,MigrationRunner,RuntimeSchema,LaunchGate};
$out=[];
try{$c=Configuration::load(dirname(__DIR__).'/config/config.php');$db=Database::connect($c['db']);$runner=new MigrationRunner($db,dirname(__DIR__).'/database');
 foreach(['supportedVersion','verifySchema','assertReady']as $stage){try{$runner->$stage();$out[$stage]='PASS';}catch(Throwable $e){$out[$stage]='FAIL';}}
 $out['runtimeSchemaIssues']=RuntimeSchema::issues($db);$manifest=json_decode(file_get_contents(dirname(__DIR__).'/database/manifest.json'),true);$records=$db->query('SELECT version,checksum FROM schema_migrations')->fetchAll(PDO::FETCH_KEY_PAIR);
 foreach($manifest['migrations']as $m)$out['baseMigrationTracking'][$m['version']]=isset($records[$m['version']])&&hash_equals($m['sha256'],$records[$m['version']])?'MATCH':'MISSING_OR_MISMATCH';
 $out['coreProductsPresent']=true;foreach($manifest['seedProductIds']as $id){$q=$db->prepare('SELECT id FROM products WHERE id=?');$q->execute([$id]);if(!$q->fetchColumn())$out['coreProductsPresent']=false;}
 $out['businessRowPresent']=(bool)$db->query("SELECT COUNT(*) FROM business_settings WHERE id='business-virasat'")->fetchColumn();$out['publishedHomepageSections']=(int)$db->query('SELECT COUNT(*) FROM homepage_sections WHERE published_content IS NOT NULL')->fetchColumn();$out['sessionDirectoryWritable']=is_dir($c['session']['path'])&&is_writable($c['session']['path']);$out['launchMode']=LaunchGate::settings()['mode'];
}catch(Throwable $e){$out['diagnostic']='INCOMPLETE_CHECK_PRIVATE_CONFIGURATION_AND_SCHEMA';}
echo json_encode($out,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n";
