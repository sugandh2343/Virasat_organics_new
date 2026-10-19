<?php
declare(strict_types=1);
namespace Virasat;
final class CustomerSecurity {
 public static function config(array $config):array {
  $config['session']['name']='__Host-virasat_customer';
  $config['session']['absolute_seconds']=min(3600,$config['session']['absolute_seconds']);
  return $config;
 }
 public static function start(Request $r,array $c):void {SessionSecurity::start($r,self::config($c));}
 public static function owner(CatalogueRepository $r):array {
  $id=$_SESSION['customer_id']??null;
  if(!is_string($id))throw new HttpError(401,'UNAUTHENTICATED','Customer sign-in required.');
  $row=$r->query("SELECT * FROM customers WHERE id=? AND status='active'",[$id])->fetch();
  if(!$row){$_SESSION=[];throw new HttpError(401,'UNAUTHENTICATED','Customer session is unavailable.');}return $row;
 }
 public static function rate(CatalogueRepository $r,string $scope,int $limit=30):void {
  $window=gmdate('Y-m-d H:i:s',(int)(floor(time()/900)*900));$hash=hash('sha256','customer:'.$scope);
  $r->query('INSERT INTO rate_limit_buckets (bucket_hash,window_start,request_count,expires_at) VALUES (?,?,1,DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 30 MINUTE)) ON DUPLICATE KEY UPDATE request_count=request_count+1',[$hash,$window]);
  if((int)$r->query('SELECT request_count FROM rate_limit_buckets WHERE bucket_hash=? AND window_start=?',[$hash,$window])->fetchColumn()>$limit){header('Retry-After: 900');throw new HttpError(429,'RATE_LIMITED','Too many requests. Try again later.');}
 }
 public static function version(Request $request,array $row):void {
  $v=$request->header('If-Match');if($v==='')throw new HttpError(428,'PRECONDITION_REQUIRED','Reload this record before saving.');
  if($v!==(string)$row['version'])throw new HttpError(409,'VERSION_CONFLICT','This record changed. Reload before saving.');
 }
}
