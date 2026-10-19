<?php
declare(strict_types=1);
namespace Virasat;
final class Configuration {
 // Local overrides use the shipped template for non-secret defaults.
 // Never fall back to defaults when no private operator configuration exists.
 public static function loadRuntime(string $directory):array{
  $local=$directory.'/config.local.php';
  if(!is_file($local))return self::load($directory.'/config.php');
  $defaults=self::load($directory.'/config.example.php');
  $override=require $local;
  if(!is_array($override))throw new \RuntimeException('Local configuration must return an array.');
  $unknown=array_diff(array_keys($override),array_keys($defaults));
  if($unknown)throw new \RuntimeException('Unknown local configuration keys.');
  // Replace lists as a unit; merge only named settings, never CORS lists.
  $config=array_replace($defaults,$override);
  foreach(['db','session','upload']as $key){
   if(isset($override[$key])){
    if(!is_array($override[$key])||array_diff(array_keys($override[$key]),array_keys($defaults[$key])))throw new \RuntimeException('Invalid local settings.');
    $config[$key]=array_replace($defaults[$key],$override[$key]);
   }
  }
  return self::validate($config);
 }
 public static function load(string $path):array{
  if(!is_file($path))throw new \RuntimeException('Private configuration missing.');$c=require $path;
  return self::validate($c);
 }
 private static function validate($c):array{
  if(!is_array($c)||!in_array($c['environment']??'',['production','development','test'],true)||($c['require_https']??null)!==true)throw new \RuntimeException('Invalid environment/HTTPS configuration.');
  if(!is_string($c['app_origin']??null)||!preg_match('#^https://[a-z0-9.-]+(?::[0-9]+)?$#D',$c['app_origin']))throw new \RuntimeException('Invalid application origin.');
  if(!is_array($c['cors_origins']??null)||!is_bool($c['cors_credentials']??null))throw new \RuntimeException('Invalid CORS configuration.');
  $local=['http://localhost:5173','http://localhost:5174','http://127.0.0.1:5173','http://127.0.0.1:5174'];
  foreach($c['cors_origins']as $o)if($o!==$c['app_origin']&&!(($c['environment']==='development')&&in_array($o,$local,true)))throw new \RuntimeException('Origin not permitted.');
  if(!is_array($c['trusted_proxies']??null))throw new \RuntimeException('Invalid proxies.');
  foreach($c['trusted_proxies']as $ip)if(!filter_var($ip,FILTER_VALIDATE_IP))throw new \RuntimeException('Use exact proxy IPs.');
  return $c;
 }
}
