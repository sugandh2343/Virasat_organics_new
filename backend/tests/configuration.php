<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\Configuration;
$root=sys_get_temp_dir().'/virasat-config-'.bin2hex(random_bytes(8));
mkdir($root,0700);
$count=0;
function expect(bool $ok):void{global $count;if(!$ok)throw new RuntimeException('Assertion failed');$count++;}
function denied(callable $fn):void{try{$fn();}catch(Throwable $e){expect(true);return;}throw new RuntimeException('Expected failure');}
function localConfig(array $value):void{global $root;file_put_contents($root.'/config.local.php','<?php return '.var_export($value,true).';');}
try{
 copy(dirname(__DIR__).'/config/config.example.php',$root.'/config.example.php');
 denied(fn()=>Configuration::loadRuntime($root)); // template alone is not configured
 copy($root.'/config.example.php',$root.'/config.php');
 expect(Configuration::loadRuntime($root)['require_https']===true);
 localConfig(['db'=>['name'=>'test-only','password'=>'test-only']]);
 $c=Configuration::loadRuntime($root);
 expect($c['db']['name']==='test-only'&&$c['db']['port']===3306);
 expect($c['db']['password']==='test-only'&&$c['require_https']===true);
 unlink($root.'/config.php');
 expect(Configuration::loadRuntime($root)['db']['name']==='test-only');
 localConfig(['require_https'=>false]);denied(fn()=>Configuration::loadRuntime($root));
 localConfig(['cors_origins'=>['*']]);denied(fn()=>Configuration::loadRuntime($root));
 localConfig(['DB_PASSWORD'=>'test-only']);denied(fn()=>Configuration::loadRuntime($root));
 localConfig(['db'=>['username'=>'test-only']]);denied(fn()=>Configuration::loadRuntime($root));
 localConfig(['db'=>'invalid']);denied(fn()=>Configuration::loadRuntime($root));
 localConfig(['cors_origins'=>[]]);expect(Configuration::loadRuntime($root)['cors_origins']===[]);
 file_put_contents($root.'/config.local.php','<?php return null;');
 denied(fn()=>Configuration::loadRuntime($root));
 // An invalid local file must not silently fall back to the legacy config.
 copy($root.'/config.example.php',$root.'/config.php');
 denied(fn()=>Configuration::loadRuntime($root));
 echo "PASS: $count configuration resolution/security assertions.\n";
}finally{
 foreach(['config.php','config.local.php','config.example.php']as $name)if(is_file($root.'/'.$name))unlink($root.'/'.$name);
 rmdir($root);
}
