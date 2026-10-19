<?php
declare(strict_types=1);
namespace Virasat;
// Verifies Google-signed Firebase ID tokens only. No service-account key is needed.
final class FirebaseIdentity {
 const KEYS='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
 private static function invalid():void { throw new HttpError(401,'TOKEN_INVALID','Phone verification expired or invalid. Sign in again.'); }
 private static function decode(string $part):string {
  if(!preg_match('/^[A-Za-z0-9_-]+$/D',$part))self::invalid();
  $v=base64_decode(strtr($part,'-_','+/'),true);if($v===false)self::invalid();return $v;
 }
 public static function verify(string $token,string $project,array $certificates,?int $now=null):array {
  $now=$now??time();if($project==='')throw new HttpError(503,'FIREBASE_UNCONFIGURED','Customer authentication is not configured.');
  if(strlen($token)>16384||count($parts=explode('.',$token))!==3)self::invalid();
  try{$h=json_decode(self::decode($parts[0]),true,16,JSON_THROW_ON_ERROR);$c=json_decode(self::decode($parts[1]),true,32,JSON_THROW_ON_ERROR);}catch(\JsonException $e){self::invalid();}
  if(!is_array($h)||!is_array($c)||($h['alg']??'')!=='RS256'||!is_string($h['kid']??null)||isset($h['crit'])||isset($h['jku'])||isset($h['x5u']))self::invalid();
  $pem=$certificates[$h['kid']]??null;if(!is_string($pem))self::invalid();
  $cert=openssl_x509_parse($pem);if(!$cert||($cert['validFrom_time_t']??PHP_INT_MAX)>$now||($cert['validTo_time_t']??0)<=$now)self::invalid();
  if(openssl_verify($parts[0].'.'.$parts[1],self::decode($parts[2]),$pem,OPENSSL_ALGO_SHA256)!==1)self::invalid();
  foreach(['exp','iat','auth_time']as $key)if(!is_int($c[$key]??null))self::invalid();
  if($c['exp']<=$now||$c['iat']>$now||$c['auth_time']>$now||$c['iat']>$c['exp']||$c['auth_time']>$c['iat']||$now-$c['auth_time']>300||isset($c['nbf'])&&(!is_int($c['nbf'])||$c['nbf']>$now))self::invalid();
  if(($c['aud']??null)!==$project||($c['iss']??null)!=='https://securetoken.google.com/'.$project||!is_string($c['sub']??null)||strlen($c['sub'])<1||strlen($c['sub'])>128||preg_match('/[\x00-\x20]/',$c['sub']))self::invalid();
  $phone=$c['phone_number']??null;
  if(!is_array($c['firebase']??null)||!is_array($c['firebase']['identities']??null)||!is_array($c['firebase']['identities']['phone']??null))self::invalid();
  if(!is_string($phone)||!preg_match('/^\+91[6-9][0-9]{9}$/D',$phone)||($c['firebase']['sign_in_provider']??null)!=='phone'||!in_array($phone,$c['firebase']['identities']['phone']??[],true))self::invalid();
  return ['uid'=>$c['sub'],'phone'=>$phone];
 }
 public static function configuredProject(array $config):string {
  $project=$config['firebase']['project_id']??getenv('VIRASAT_FIREBASE_PROJECT_ID');
  if(!is_string($project)||!preg_match('/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/D',$project))throw new HttpError(503,'FIREBASE_UNCONFIGURED','Customer authentication is not configured.');return $project;
 }
 public static function authenticate(string $token,array $config):array {
  $project=self::configuredProject($config);
  return self::verify($token,$project,self::keys($config['session']['path']));
 }
 private static function keys(string $directory):array {
  $directory=realpath($directory);if(!$directory||!is_writable($directory))throw new HttpError(503,'PROVIDER_UNAVAILABLE','Identity verification is temporarily unavailable.');
  $file=$directory.'/.firebase-public-keys.json';
  $lock=fopen($directory.'/.firebase-public-keys.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new \RuntimeException('Key cache unavailable.');
  try {
   if(is_file($file)){$cached=json_decode((string)file_get_contents($file),true);if(is_array($cached)&&($cached['expires']??0)>time()&&is_array($cached['keys']??null))return $cached['keys'];}
   if(!function_exists('curl_init'))throw new HttpError(503,'PROVIDER_UNAVAILABLE','Identity verification requires server cURL.');
   $ttl=300;$raw='';$curl=curl_init(self::KEYS);
   curl_setopt_array($curl,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>10,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
    CURLOPT_HEADERFUNCTION=>static function($ch,$line)use(&$ttl){if(preg_match('/^cache-control:.*max-age=(\d+)/i',$line,$m))$ttl=max(1,min(21600,(int)$m[1]));return strlen($line);},
    CURLOPT_WRITEFUNCTION=>static function($ch,$chunk)use(&$raw){if(strlen($raw)+strlen($chunk)>65536)return 0;$raw.=$chunk;return strlen($chunk);}]);
   $ok=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);
   $keys=json_decode($raw,true);if(!$ok||$status!==200||!is_array($keys)||!$keys)throw new HttpError(503,'PROVIDER_UNAVAILABLE','Identity provider is unavailable. Try later.');
   foreach($keys as $key=>$pem)if(!is_string($key)||!is_string($pem)||!openssl_x509_parse($pem))throw new \RuntimeException('Invalid signing keys.');
   file_put_contents($file,json_encode(['expires'=>time()+$ttl,'keys'=>$keys],JSON_THROW_ON_ERROR),LOCK_EX);chmod($file,0600);return $keys;
  }finally{flock($lock,LOCK_UN);fclose($lock);}
 }
}
