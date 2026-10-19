<?php
declare(strict_types=1);
namespace Virasat;
final class OperationsRules {
 public const PERMISSIONS=['orders.read','orders.manage','customers.read','reports.read','inventory.read','inventory.write','delivery.read','delivery.manage','payments.record_cod','notifications.read'];
 public static function page(array $q):array {$page=filter_var($q['page']??1,FILTER_VALIDATE_INT);$size=filter_var($q['pageSize']??20,FILTER_VALIDATE_INT);if(!$page||$page<1||$page>100000||!$size||$size<1||$size>100)CatalogueRules::fail('Invalid pagination.');return [$page,$size];}
 public static function range(array $q):array {
  $tz=new \DateTimeZone('Asia/Kolkata');$today=new \DateTimeImmutable('today',$tz);$preset=$q['range']??'30';if(!in_array($preset,['today','7','30','custom'],true))CatalogueRules::fail('Invalid date range.');
  $from=$preset==='custom'?($q['from']??''):$today->modify('-'.($preset==='today'?0:(int)$preset-1).' days')->format('Y-m-d');$to=$preset==='custom'?($q['to']??''):$today->format('Y-m-d');
  $dates=[];foreach([$from,$to]as $date){if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date))CatalogueRules::fail('Use valid dates.');$d=\DateTimeImmutable::createFromFormat('!Y-m-d',$date,$tz);if(!$d||$d->format('Y-m-d')!==$date)CatalogueRules::fail('Use valid dates.');$dates[]=$d;}
  if($dates[0]>$dates[1]||$dates[0]->diff($dates[1])->days>366)CatalogueRules::fail('Choose an ordered range of at most 367 days.');
  return ['from'=>$from,'to'=>$to,'timezone'=>'Asia/Kolkata','start'=>$dates[0]->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s'),'end'=>$dates[1]->modify('+1 day')->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s')];
 }
 public static function csv(array $rows):string {
  $fp=fopen('php://temp','r+');if($rows){fputcsv($fp,array_keys($rows[0]),',','"','');foreach($rows as $row){$v=[];foreach($row as $cell){$text=(string)($cell??'');if(preg_match('/^[\s\x00-\x1f\x{FEFF}]*[=+@-]/u',$text)||preg_match('/^[\t\r\n]/',$text))$text="'".$text;$v[]=$text;}fputcsv($fp,$v,',','"','');}}rewind($fp);$out=stream_get_contents($fp);fclose($fp);return $out;
 }
 public static function integer($value):int {if(!is_numeric($value)||$value<0||$value>9007199254740991||floor((float)$value)!=(float)$value)throw new HttpError(409,'REPORT_OVERFLOW','Amount requires operator reconciliation.');return (int)$value;}
}
