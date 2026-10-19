<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{LaunchGate,CrawlerController,HttpError};
$n=0;function ok($v){global $n;if(!$v)throw new RuntimeException('Assertion '.($n+1));$n++;}
$disabled=['mode'=>'disabled','customer_ids'=>['one'],'acceptance_completed'=>false];ok(!LaunchGate::allows($disabled,'one'));ok(!LaunchGate::allows($disabled,null));
$acceptance=['mode'=>'acceptance','customer_ids'=>['one'],'acceptance_completed'=>false];ok(LaunchGate::allows($acceptance,'one'));ok(!LaunchGate::allows($acceptance,'two'));ok(!LaunchGate::allows($acceptance,null));
$public=['mode'=>'public','customer_ids'=>[],'acceptance_completed'=>false];ok(!LaunchGate::allows($public,'one'));$public['acceptance_completed']=true;ok(LaunchGate::allows($public,null));
$path=sys_get_temp_dir().'/virasat-launch-'.bin2hex(random_bytes(8)).'.php';ok(LaunchGate::settings($path)['mode']==='disabled');
try{file_put_contents($path,"<?php return ['mode'=>'public','customer_ids'=>[],'acceptance_completed'=>'yes'];");try{LaunchGate::settings($path);ok(false);}catch(HttpError $e){ok($e->errorCode==='LAUNCH_CONFIGURATION_INVALID');}}finally{if(is_file($path))unlink($path);}
ok(strpos(CrawlerController::xml(['https://example.invalid/?a=1&b=2']),'&amp;')!==false);ok(!is_file(dirname(__DIR__).'/config/launch.php'));echo 'PASS: '.$n." launch/sitemap assertions; acceptance disabled, no live changes.\n";
