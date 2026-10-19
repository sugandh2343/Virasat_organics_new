<?php
declare(strict_types=1);
namespace Virasat;
final class RuntimeSchema {
 public const REQUIRED=[
  'delivery_settings'=>['tax_mode','tax_basis_points','tax_shipping','maximum_distance_m'],
  'delivery_zones'=>['estimate_min_days','estimate_max_days'],
  'delivery_zone_pins'=>['latitude','longitude','coverage_radius_m'],
  'checkout_quotes'=>['snapshot'],'orders'=>['request_hash'],'payments'=>['verified_at','failure_code'],
  'razorpay_order_requests'=>['id','order_id','idempotency_key'],
  'homepage_sections'=>['published_content','published_at'],'banners'=>['name','description','published_at'],
  'blog_posts'=>['author_display'],'business_settings'=>['legal_name'],'inventory_balances'=>['low_stock_threshold'],
  'cod_collections'=>['order_id','actor_admin_id','amount_paise','reference_note','request_key','collected_at'],
  'operation_notifications'=>['id','event_key','event_type','resource_id','message','occurred_at','email_status'],
  'operation_notification_reads'=>['notification_id','admin_user_id','read_at']];
 public static function issues(\PDO $db):array {
  $columns=[];foreach($db->query('SELECT TABLE_NAME,COLUMN_NAME,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()')as $v)$columns[$v['TABLE_NAME']][$v['COLUMN_NAME']]=$v;
  $issues=[];foreach(self::REQUIRED as $table=>$required)foreach($required as $column)if(!isset($columns[$table][$column]))$issues[]='MISSING_COLUMN:'.$table.'.'.$column;
  if(($columns['customers']['firebase_uid']['COLLATION_NAME']??'')!=='utf8mb4_bin')$issues[]='FIREBASE_UID_COLLATION';
  $indexes=[];foreach($db->query('SELECT TABLE_NAME,INDEX_NAME,COLUMN_NAME,NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY SEQ_IN_INDEX')as $v)if(!(int)$v['NON_UNIQUE'])$indexes[$v['TABLE_NAME']][$v['INDEX_NAME']][]=$v['COLUMN_NAME'];
  foreach(['cod_collections'=>[['order_id']],'operation_notifications'=>[['event_key']],'operation_notification_reads'=>[['notification_id','admin_user_id']]]as $table=>$keys)foreach($keys as $key)if(!in_array($key,$indexes[$table]??[],true))$issues[]='MISSING_UNIQUE:'.$table;
  return $issues;
 }
 public static function assertReady(\PDO $db):void {if(self::issues($db))throw new \RuntimeException('Runtime schema prerequisites missing.');}
}
