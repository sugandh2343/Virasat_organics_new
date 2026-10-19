<?php
declare(strict_types=1);
namespace Virasat;
final class CommerceRules {
 const MAX_MONEY=1000000000000;
 const NEXT=['placed'=>'confirmed','confirmed'=>'packed','packed'=>'shipped','shipped'=>'out_for_delivery','out_for_delivery'=>'delivered'];
 public static function fail(string $code,string $message,int $status=422):void {throw new HttpError($status,$code,$message);}
 public static function enabled(array $config):bool {return ($config['commerce']['order_acceptance_enabled']??(getenv('ORDER_ACCEPTANCE_ENABLED')==='true'))===true;}
 public static function money($v,bool $nullable=false):?int {if($v===null&&$nullable)return null;if(!is_int($v)||$v<0||$v>self::MAX_MONEY)self::fail('VALIDATION_FAILED','Use nonnegative integer paise within the supported limit.');return $v;}
 public static function sum(int ...$values):int {$n=0;foreach($values as $v){self::money($v);if($n>self::MAX_MONEY-$v)self::fail('AMOUNT_LIMIT','Amount exceeds the supported limit.');$n+=$v;}return $n;}
 public static function line(int $price,int $quantity):int {self::money($price);if($quantity<1||$quantity>10000||$price>intdiv(self::MAX_MONEY,$quantity))self::fail('VALIDATION_FAILED','Invalid quantity or line amount.');return $price*$quantity;}
 public static function id($v):string {if(!is_string($v)||!preg_match('/^[a-zA-Z0-9_-]{1,64}$/D',$v))self::fail('VALIDATION_FAILED','Invalid record reference.');return $v;}
 public static function pin($v):string {if(!is_string($v)||!preg_match('/^[1-9][0-9]{5}$/D',$v))self::fail('INVALID_PIN','Enter a valid six-digit Indian PIN.');return $v;}
 public static function items($items):array {if(!is_array($items)||!count($items)||count($items)>100)self::fail('VALIDATION_FAILED','Supply between one and 100 cart items.');$out=[];foreach($items as $item){if(!is_array($item))self::fail('VALIDATION_FAILED','Invalid cart item.');Request::allowFields($item,['productId','quantity','sku']);$id=self::id($item['productId']??null);$q=$item['quantity']??null;if(!is_int($q)||$q<1||$q>10000||isset($out[$id]))self::fail('VALIDATION_FAILED','Invalid or duplicate cart quantity.');if(isset($item['sku'])&&!is_string($item['sku']))self::fail('VALIDATION_FAILED','Invalid SKU.');$out[$id]=$item;}ksort($out);return array_values($out);}
 public static function transition(string $from,string $to):void {if(($to==='cancelled'&&in_array($from,['placed','confirmed'],true))||(self::NEXT[$from]??null)===$to)return;self::fail('INVALID_TRANSITION','This order status transition is not allowed.',409);}
 public static function tax(int $base,?string $mode,$bps):int {self::money($base);if($mode==='none'&&$bps===0)return 0;if($mode!=='exclusive_bps'||!is_int($bps)||$bps<0||$bps>10000)self::fail('UNCONFIGURED','Tax policy has not been configured.');return intdiv($base*$bps+5000,10000);}
 public static function key(string $key):string {if(!preg_match('/^[a-zA-Z0-9_-]{16,128}$/D',$key))self::fail('PRECONDITION_REQUIRED','A valid idempotency key is required.',428);return $key;}
 public static function time(string $v):string {return str_replace(' ','T',$v).'Z';}
}
