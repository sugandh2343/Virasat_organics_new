<?php
declare(strict_types=1);
namespace Virasat;
/** Private configuration and bounded HTTPS transport. No SDK or secrets in frontend. */
final class RazorpayProvider {
 private array $settings; private $transport;
 public function __construct(array $config,?callable $transport=null){
  $p=$config['payments']['razorpay']??[];
  $this->settings=['enabled'=>($p['enabled']??(getenv('RAZORPAY_ENABLED')==='true'))===true];
  foreach(['key_id','key_secret','webhook_secret'] as $key)$this->settings[$key]=$p[$key]??(getenv('RAZORPAY_'.strtoupper($key))?:'');
  $this->transport=$transport;
 }
 public function ready():bool {
  return $this->settings['enabled']&&is_string($this->settings['key_id'])&&preg_match('/^rzp_(test|live)_[a-zA-Z0-9]+$/D',$this->settings['key_id'])===1
   &&is_string($this->settings['key_secret'])&&strlen($this->settings['key_secret'])>=16
   &&is_string($this->settings['webhook_secret'])&&strlen($this->settings['webhook_secret'])>=16;
 }
 public function requireReady():void {if(!$this->ready())throw new HttpError(503,'PAYMENT_UNAVAILABLE','Online payments are not enabled or configured.');}
 public function keyId():string {$this->requireReady();return $this->settings['key_id'];}
 public static function id($id,string $prefix):string {if(!is_string($id)||!preg_match('/^'.preg_quote($prefix,'/').'_[a-zA-Z0-9]{1,100}$/D',$id))throw new HttpError(422,'INVALID_PAYMENT_REFERENCE','Invalid provider reference.');return $id;}
 public static function hmac(string $raw,string $signature,string $secret):bool {return preg_match('/^[a-f0-9]{64}$/D',$signature)===1&&hash_equals(hash_hmac('sha256',$raw,$secret),$signature);}
 public function verifySignature(string $order,string $payment,string $signature):void {
  $this->requireReady();if(!self::hmac($order.'|'.$payment,$signature,$this->settings['key_secret']))throw new HttpError(400,'PAYMENT_SIGNATURE_INVALID','Payment signature was not verified.');
 }
 public function verifyWebhook(string $raw,string $signature):void {
  $this->requireReady();if(!self::hmac($raw,$signature,$this->settings['webhook_secret']))throw new HttpError(400,'WEBHOOK_SIGNATURE_INVALID','Webhook signature was not verified.');
 }
 public function createOrder(int $amount,string $receipt):array {CommerceRules::money($amount);if($amount<100)throw new HttpError(422,'PAYMENT_AMOUNT_INVALID','Online payment requires at least 100 paise.');return $this->call('POST','/orders',['amount'=>$amount,'currency'=>'INR','receipt'=>$receipt,'partial_payment'=>false]);}
 public function fetchPayment(string $id):array {return $this->call('GET','/payments/'.self::id($id,'pay'));}
 // Auto-capture is the intended merchant setting. Authorized stays pending until fetched captured.
 // Explicit capture is available for a future reviewed reconciliation worker, never automatic here.
 public function capture(string $id,int $amount):array {CommerceRules::money($amount);return $this->call('POST','/payments/'.self::id($id,'pay').'/capture',['amount'=>$amount,'currency'=>'INR']);}
 private function call(string $method,string $path,?array $body=null):array {
  $this->requireReady();
  if($this->transport)return ($this->transport)($method,$path,$body);
  if(!extension_loaded('curl'))throw new HttpError(503,'PROVIDER_UNAVAILABLE','Payment provider transport is unavailable.');
  $ch=curl_init('https://api.razorpay.com/v1'.$path);$raw='';
  curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_USERPWD=>$this->settings['key_id'].':'.$this->settings['key_secret'],CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>15,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_WRITEFUNCTION=>static function($ch,$chunk)use(&$raw){if(strlen($raw)+strlen($chunk)>262144)return 0;$raw.=$chunk;return strlen($chunk);}]);
  if($body!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR));
  $ok=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
  if($ok===false||$status<200||$status>=300){error_log('virasat payment failure=PROVIDER_UNAVAILABLE');throw new HttpError(503,'PROVIDER_UNAVAILABLE','Payment provider is unavailable. Do not start a new attempt.');}
  try{$data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\JsonException $e){$data=null;}
  if(!is_array($data)){error_log('virasat payment failure=PROVIDER_RESPONSE_INVALID');throw new HttpError(503,'PROVIDER_RESPONSE_INVALID','Payment provider response is invalid.');}return $data;
 }
}
