<?php
declare(strict_types=1);
namespace Virasat;
final class CMSRules {
 const SECTIONS=['hero','categories','collection','introduction','gallery','story','values','journal','testimonials','newsletter'];
 const PAGES=['our-story','about','contact','privacy-policy','terms-and-conditions','shipping-policy','returns-refunds','faq'];
 public static function text($v,int $max=10000,bool $required=false):string{return CatalogueRules::text($v??'',$max,$required);}
 public static function bool($v):bool {if(!is_bool($v))CatalogueRules::fail('Use true or false.');return $v;}
 public static function slug($v):string{$v=self::text($v,120,true);if(!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$v))CatalogueRules::fail('Use a lowercase hyphenated slug.');return $v;}
 public static function url($v,bool $relative=true):string{$v=self::text($v,2048);if($v==='')return '';if($relative&&preg_match('#^/(?!/)[a-zA-Z0-9/_?=&%\#.-]*$#D',$v))return $v;$p=parse_url($v);if(!$p||($p['scheme']??'')!=='https'||empty($p['host'])||isset($p['user'])||isset($p['pass'])||preg_match('/[\x00-\x20\\\\]/',$v))CatalogueRules::fail('Use an internal path or an HTTPS URL without credentials.');return $v;}
 public static function compliance($v,string $kind,bool $visible):?string{$s=strtoupper(self::text($v,32));$valid=$kind==='gstin'?preg_match('/^(0[1-9]|[12][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/D',$s):preg_match('/^[1-9][0-9]{13}$/D',$s);if(($s!==''||$visible)&&!$valid)CatalogueRules::fail('Supply a validly formatted registration value or disable visibility. Format is not licensing verification.');return $s?:null;}
 public static function tree($v,int $depth=0):void{if($depth>16)CatalogueRules::fail('Content nesting exceeds limit.');if(is_string($v)){self::text($v);return;}if($v===null||is_bool($v)||is_int($v))return;if(!is_array($v)||count($v)>100)CatalogueRules::fail('Invalid structured content.');foreach($v as $k=>$x){if(is_string($k)&&preg_match('/secret|password|token|apiKey|privateKey/i',$k))CatalogueRules::fail('Credentials are not content.');if(in_array($k,['src','poster','captions','logoSrc'],true)&&$x!==null&&$x!=='')CatalogueRules::fail('Select library media instead of supplying a source URL.');if(in_array($k,['to','destination','actionTo'],true))self::url($x);self::tree($x,$depth+1);}}
 public static function blocks($v):array{if(!is_array($v)||count($v)>100)CatalogueRules::fail('Use at most 100 structured blocks.');$out=[];$seen=[];foreach($v as $b){if(!is_array($b))CatalogueRules::fail('Invalid content block.');Request::allowFields($b,['id','type','text','mediaId','alt']);$id=CommerceRules::id($b['id']??null);if(isset($seen[$id]))CatalogueRules::fail('Duplicate block ID.');$seen[$id]=true;if(!in_array($b['type']??null,['paragraph','heading','quote','list','image'],true))CatalogueRules::fail('Raw HTML blocks are not supported.');$out[]=['id'=>$id,'type'=>$b['type'],'text'=>self::text($b['text']??''),'mediaId'=>empty($b['mediaId'])?null:CommerceRules::id($b['mediaId']),'alt'=>self::text($b['alt']??'',200)];}return $out;}
 public static function home(array $v):array{
  Request::allowFields($v,['id','slug','version','sections','story','values','journal','testimonials','newsletter','eyebrow','title','emphasis','description','action','secondaryAction','showcase','video','media','shopping','highlights','chrome','publishConfirmed','publishedAt']);self::tree($v);
  if(!is_array($v['sections']??null)||count($v['sections'])!==10)CatalogueRules::fail('Keep all ten original homepage sections.');$ids=[];$orders=[];foreach($v['sections']as $s){Request::allowFields($s,['id','order','enabled']);if(!in_array($s['id']??'',self::SECTIONS,true)||isset($ids[$s['id']])||!is_int($s['order']??null)||$s['order']<0||$s['order']>9||isset($orders[$s['order']]))CatalogueRules::fail('Each section and order must occur once.');self::bool($s['enabled']??null);$ids[$s['id']]=true;$orders[$s['order']]=true;}
  // Validate the existing render shape; optional library IDs extend media slots only.
  $shape=json_decode(file_get_contents(dirname(__DIR__,2).'/config/home-schema.json'),true,64,JSON_THROW_ON_ERROR);
  self::shape($shape,$v);
  foreach($v['testimonials']['items']as $item){Request::allowFields($item,['id','name','quote','approved']);CommerceRules::id($item['id']??null);self::text($item['name']??'',200,true);self::text($item['quote']??'',2000,true);self::bool($item['approved']??null);}
  return $v;
 }
 private static function shape($shape,$v,string $path=''):void{
  if($shape===null){if($v!==null&&!is_string($v)&&!is_array($v))CatalogueRules::fail('Invalid optional content.');return;}
  if(is_string($shape)){if(!is_string($v))CatalogueRules::fail('Text required at '.$path);return;}
  if(is_bool($shape)){self::bool($v);return;}
  if(is_int($shape)){if(!is_int($v))CatalogueRules::fail('Integer required.');return;}
  if(!is_array($v))CatalogueRules::fail('Missing content group '.$path);
  if($shape&&array_keys($shape)===range(0,count($shape)-1)){foreach($v as $item)self::shape($shape[0],$item,$path);return;}
  foreach($shape as $k=>$x){if(in_array($k,['id','slug','sections'],true)&&$path==='')continue;if($x===null&&!array_key_exists($k,$v))continue;if(!array_key_exists($k,$v))CatalogueRules::fail('Missing content field '.$path.'.'.$k);self::shape($x,$v[$k],$path.'.'.$k);}
 }
 public static function fragment(array $h,string $key):array{
  $groups=['hero'=>['eyebrow','title','emphasis','description','action','secondaryAction','showcase','highlights'],'story'=>['story'],'values'=>['values'],'journal'=>['journal'],'testimonials'=>['testimonials'],'newsletter'=>['newsletter']];
  if(isset($groups[$key]))return array_intersect_key($h,array_flip($groups[$key]));
  if(in_array($key,['categories','collection'],true))return ['shopping'=>[$key=>$h['shopping'][$key]]];
  if($key==='introduction')return ['video'=>$h['video'],'media'=>['introduction'=>$h['media']['introduction']]];
  return ['media'=>['gallery'=>$h['media']['gallery']]];
 }
}
