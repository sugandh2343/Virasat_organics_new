<?php
declare(strict_types=1);
namespace Virasat;
final class LaunchGate {
 public static function settings(?string $path=null):array {
  $path=$path??dirname(__DIR__,2).'/config/launch.php';if(!is_file($path))return ['mode'=>'disabled','customer_ids'=>[],'acceptance_completed'=>false];
  $v=require $path;if(!is_array($v)||array_diff(array_keys($v),['mode','customer_ids','acceptance_completed'])||!in_array($v['mode']??null,['disabled','acceptance','public'],true)||!is_bool($v['acceptance_completed']??null)||!is_array($v['customer_ids']??null)||count($v['customer_ids'])>5)throw new HttpError(503,'LAUNCH_CONFIGURATION_INVALID','Order acceptance requires operator review.');
  foreach($v['customer_ids']as $id)if(!is_string($id)||!preg_match('/^[a-zA-Z0-9_-]{1,64}$/D',$id))throw new HttpError(503,'LAUNCH_CONFIGURATION_INVALID','Order acceptance requires operator review.');return $v;
 }
 public static function allows(array $v,?string $owner):bool {if(($v['mode']??'disabled')==='public')return ($v['acceptance_completed']??false)===true;if(($v['mode']??'')==='acceptance')return $owner!==null&&in_array($owner,$v['customer_ids']??[],true);return false;}
 public static function enabled(?string $owner=null):bool{return self::allows(self::settings(),$owner);}
}
