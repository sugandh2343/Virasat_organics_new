<?php
declare(strict_types=1);
namespace Virasat;
final class CatalogueRules {
 const STATUSES=['active','inactive','out_of_stock','coming_soon'];
 public static function fail(string $message):void{throw new HttpError(422,'VALIDATION_FAILED',$message);}
 public static function text($v,int $max=10000,bool $required=false):?string{
  if($v===null&&!$required)return null;
  if(!is_string($v)||strlen($v)>$max||($required&&trim($v)==='')||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$v))self::fail('Invalid text field.');
  return trim($v);
 }
 public static function integer($v,int $max=2147483647,bool $nullable=true):?int{
  if($v===null&&$nullable)return null;
  if(!is_int($v)||$v<0||$v>$max)self::fail('Expected a non-negative integer within limits.');
  return $v;
 }
 public static function slug($v):string{
  $v=self::text($v,120,true);if(!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$v))self::fail('Use a lowercase hyphenated slug.');return $v;
 }
 public static function visible(string $s):bool{return in_array($s,['active','out_of_stock','coming_soon'],true);}
 public static function purchasable(array $p):bool{return $p['status']==='active'&&is_int($p['pricePaise'])&&$p['pricePaise']>=0&&is_int($p['stock'])&&$p['stock']>0;}
 public static function stock(?int $before,int $reserved,string $mode,$amount):int{
  if(!in_array($mode,['set','adjust'],true)||!is_int($amount)||abs($amount)>2147483647||($mode==='adjust'&&$before===null))self::fail('Configure initial stock before adjusting.');
  $next=$mode==='set'?$amount:$before+$amount;
  if($next<0||$next<$reserved||$next>2147483647)self::fail('Stock must cover reservations and cannot be negative.');
  return $next;
 }
 public static function product(array $v):array{
  Request::allowFields($v,['name','slug','sku','size','categoryId','status','pricePaise','compareAtPricePaise','shortDescription','longDescription','ingredients','nutrition','storage','specifications','seo','keywords','stock','stockNote','imageIds','videoIds']);
  foreach(['name'=>200,'sku'=>120,'size'=>40,'categoryId'=>64]as $key=>$max)$v[$key]=self::text($v[$key]??null,$max,true);
  $v['slug']=self::slug($v['slug']??null);
  if(!in_array($v['status']??null,self::STATUSES,true))self::fail('Invalid product status.');
  foreach(['pricePaise','compareAtPricePaise']as $key)$v[$key]=self::integer($v[$key]??null,9007199254740991);
  if($v['pricePaise']!==null&&$v['compareAtPricePaise']!==null&&$v['compareAtPricePaise']<$v['pricePaise'])self::fail('MRP cannot be below selling price.');
  foreach(['shortDescription','longDescription','storage']as $key)$v[$key]=self::text($v[$key]??null);
  foreach(['ingredients','keywords','imageIds','videoIds']as $key){
   $v[$key]=$v[$key]??[];if(!is_array($v[$key])||array_keys($v[$key])!==range(0,count($v[$key])-1)&&$v[$key]!==[]||count($v[$key])>100)self::fail('Expected a bounded list.');
   foreach($v[$key]as $entry)self::text($entry,$key==='ingredients'?500:120,true);
   if(count(array_unique($v[$key]))!==count($v[$key]))self::fail('Duplicate list entries.');
  }
  $v['specifications']=$v['specifications']??new \stdClass();$v['seo']=$v['seo']??new \stdClass();
  foreach(['specifications','seo']as $key)if(!is_array($v[$key])&&!is_object($v[$key]))self::fail('Expected an object.');
  foreach((array)$v['specifications']as $key=>$value){self::text((string)$key,100,true);self::text($value,2000);}
  $v['specifications']=(object)$v['specifications'];
  $v['seo']=(array)$v['seo'];Request::allowFields($v['seo'],['title','description']);
  $v['seo']=['title'=>self::text($v['seo']['title']??null,200),'description'=>self::text($v['seo']['description']??null)];
  $v['nutrition']=$v['nutrition']??null;
  if(strlen(json_encode($v['nutrition'],JSON_THROW_ON_ERROR))>10000)self::fail('Nutrition data too large.');
  if(array_key_exists('stock',$v))$v['stock']=self::integer($v['stock']);
  $v['stockNote']=self::text($v['stockNote']??null,2000);
  return $v;
 }
 public static function page(array $q):array{
  foreach(['page'=>1,'pageSize'=>20]as $k=>$d){$n=$q[$k]??$d;if(filter_var($n,FILTER_VALIDATE_INT)===false||(int)$n<1||(int)$n>($k==='pageSize'?100:1000000))throw new HttpError(400,'BAD_REQUEST','Invalid pagination.');$q[$k]=(int)$n;}
  return $q;
 }
}
