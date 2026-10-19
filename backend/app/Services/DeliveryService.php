<?php
declare(strict_types=1);
namespace Virasat;
final class DeliveryService {
 private CatalogueRepository $r;
 public function __construct(CatalogueRepository $r){$this->r=$r;}
 public function settings(bool $lock=false):array {return $this->r->one("SELECT * FROM delivery_settings WHERE id='delivery-settings'".($lock?' FOR UPDATE':''));}
 public static function distance(float $a,float $b,float $c,float $d):int {$x=sin(deg2rad($c-$a)/2)**2+cos(deg2rad($a))*cos(deg2rad($c))*sin(deg2rad($d-$b)/2)**2;return (int)ceil(6371000*2*asin(sqrt(min(1,max(0,$x)))));}
 public function evaluate(string $pin,?int $subtotal=null):array {
  CommerceRules::pin($pin);$s=$this->settings();
  if(!(bool)$s['configured'])CommerceRules::fail('UNCONFIGURED','Delivery settings are not configured.');
  $z=$this->r->query("SELECT z.*,p.latitude,p.longitude,p.coverage_radius_m FROM delivery_zones z JOIN delivery_zone_pins p ON p.zone_id=z.id WHERE p.postal_code=? AND z.status='active'",[$pin])->fetch();
  if(!$z)CommerceRules::fail('DELIVERY_UNAVAILABLE','Delivery is not available for this PIN.');
  if($s['maximum_distance_m']!==null){
   $o=json_decode($s['origin_address']??'null',true);if(!is_array($o)||!isset($o['latitude'],$o['longitude'])||$z['latitude']===null||$z['longitude']===null||$z['coverage_radius_m']===null)CommerceRules::fail('UNCONFIGURED','Administrator-reviewed PIN coverage and origin coordinates are required for radius delivery.');
   // Conservative whole-area bound; customer-supplied coordinates never determine coverage.
   if(self::distance((float)$o['latitude'],(float)$o['longitude'],(float)$z['latitude'],(float)$z['longitude'])+(int)$z['coverage_radius_m']>(int)$s['maximum_distance_m'])CommerceRules::fail('DELIVERY_UNAVAILABLE','This PIN coverage is outside the configured delivery radius.');
  }
  $shipping=$z['shipping_paise']??$s['default_shipping_paise'];$minimum=$z['minimum_order_paise']??$s['minimum_order_paise'];$free=$z['free_shipping_threshold_paise']??$s['free_shipping_threshold_paise'];
  if($shipping===null||$minimum===null)CommerceRules::fail('UNCONFIGURED','Shipping and minimum order rules require configuration.');
  $shipping=CommerceRules::money((int)$shipping);$minimum=CommerceRules::money((int)$minimum);if($free!==null)CommerceRules::money((int)$free);
  if($subtotal!==null){CommerceRules::money($subtotal);if($subtotal<$minimum)CommerceRules::fail('MINIMUM_ORDER','This cart is below the configured minimum order amount.');if($free!==null&&$subtotal>=(int)$free)$shipping=0;}
  return ['serviceable'=>true,'zoneId'=>$z['id'],'zoneVersion'=>(int)$z['version'],'settingsVersion'=>(int)$s['version'],'shippingPaise'=>$shipping,'minimumOrderPaise'=>$minimum,'freeShippingThresholdPaise'=>$free===null?null:(int)$free,'codEnabled'=>(bool)$s['cod_enabled']&&(bool)$z['cod_enabled'],'estimateMinDays'=>$z['estimate_min_days']===null?null:(int)$z['estimate_min_days'],'estimateMaxDays'=>$z['estimate_max_days']===null?null:(int)$z['estimate_max_days']];
 }
 public function view():array {
  $s=$this->settings();$settings=['version'=>(int)$s['version'],'configured'=>(bool)$s['configured'],'codEnabled'=>(bool)$s['cod_enabled'],'origin'=>json_decode($s['origin_address']??'null',true),'taxMode'=>$s['tax_mode'],'taxPolicyVersion'=>$s['tax_policy_version'],'taxShipping'=>(bool)$s['tax_shipping']];
  foreach(['defaultShippingPaise'=>'default_shipping_paise','minimumOrderPaise'=>'minimum_order_paise','freeShippingThresholdPaise'=>'free_shipping_threshold_paise','taxBasisPoints'=>'tax_basis_points','maximumDistanceM'=>'maximum_distance_m'] as $key=>$col)$settings[$key]=$s[$col]===null?null:(int)$s[$col];
  $zones=[];foreach($this->r->query('SELECT * FROM delivery_zones ORDER BY priority,id')->fetchAll()as $z){$v=['id'=>$z['id'],'name'=>$z['name'],'status'=>$z['status'],'version'=>(int)$z['version'],'codEnabled'=>(bool)$z['cod_enabled']];foreach(['shippingPaise'=>'shipping_paise','minimumOrderPaise'=>'minimum_order_paise','freeShippingThresholdPaise'=>'free_shipping_threshold_paise','estimateMinDays'=>'estimate_min_days','estimateMaxDays'=>'estimate_max_days']as $key=>$col)$v[$key]=$z[$col]===null?null:(int)$z[$col];$v['pins']=array_map(fn($p)=>['postalCode'=>$p['postal_code'],'latitude'=>$p['latitude']===null?null:(float)$p['latitude'],'longitude'=>$p['longitude']===null?null:(float)$p['longitude'],'coverageRadiusM'=>$p['coverage_radius_m']===null?null:(int)$p['coverage_radius_m']],$this->r->query('SELECT * FROM delivery_zone_pins WHERE zone_id=? ORDER BY postal_code',[$z['id']])->fetchAll());$zones[]=$v;}
  return ['settings'=>$settings,'zones'=>$zones];
 }
 private static function boolean($v):int {if(!is_bool($v))CommerceRules::fail('VALIDATION_FAILED','Expected a boolean setting.');return $v?1:0;}
 private static function bounded($v,int $max):?int {if($v===null)return null;if(!is_int($v)||$v<0||$v>$max)CommerceRules::fail('VALIDATION_FAILED','Invalid numeric setting.');return $v;}
 private static function coordinates($lat,$lng):void {if(!is_numeric($lat)||!is_numeric($lng)||!is_finite((float)$lat)||!is_finite((float)$lng)||abs((float)$lat)>90||abs((float)$lng)>180)CommerceRules::fail('VALIDATION_FAILED','Invalid coordinates.');}
 public function saveSettings(array $b,Request $q):array {
  Request::allowFields($b,['configured','codEnabled','defaultShippingPaise','minimumOrderPaise','freeShippingThresholdPaise','origin','maximumDistanceM','taxMode','taxBasisPoints','taxShipping','taxPolicyVersion']);$old=$this->settings(true);CustomerSecurity::version($q,$old);
  $v=['configured'=>self::boolean($b['configured']??false),'cod_enabled'=>self::boolean($b['codEnabled']??false),'tax_shipping'=>self::boolean($b['taxShipping']??false),'maximum_distance_m'=>self::bounded($b['maximumDistanceM']??null,20000000)];
  foreach(['defaultShippingPaise'=>'default_shipping_paise','minimumOrderPaise'=>'minimum_order_paise','freeShippingThresholdPaise'=>'free_shipping_threshold_paise']as $k=>$c)$v[$c]=CommerceRules::money($b[$k]??null,true);
  $mode=$b['taxMode']??null;if(!in_array($mode,[null,'none','exclusive_bps'],true))CommerceRules::fail('VALIDATION_FAILED','Unsupported tax policy.');$v['tax_mode']=$mode;$v['tax_basis_points']=self::bounded($b['taxBasisPoints']??null,10000);$v['tax_policy_version']=CatalogueRules::text($b['taxPolicyVersion']??null,100)?:null;
  $origin=$b['origin']??null;if($origin!==null){if(!is_array($origin))CommerceRules::fail('VALIDATION_FAILED','Invalid origin.');Request::allowFields($origin,['latitude','longitude','address']);self::coordinates($origin['latitude']??null,$origin['longitude']??null);$origin=['latitude'=>(float)$origin['latitude'],'longitude'=>(float)$origin['longitude'],'address'=>CatalogueRules::text($origin['address']??null,500)];}$v['origin_address']=$origin===null?null:json_encode($origin,JSON_THROW_ON_ERROR);
  if($v['configured']){if(!$v['tax_policy_version']||$v['tax_basis_points']===null)CommerceRules::fail('UNCONFIGURED','A reviewed explicit tax policy is required.');CommerceRules::tax(0,$mode,$v['tax_basis_points']);if($v['maximum_distance_m']!==null&&$origin===null)CommerceRules::fail('UNCONFIGURED','A delivery origin is required.');}
  $this->r->update('delivery_settings','delivery-settings',$v);return $this->view();
 }
 public function saveZone(array $b,?string $id,Request $q):array {
  Request::allowFields($b,['name','status','codEnabled','shippingPaise','minimumOrderPaise','freeShippingThresholdPaise','estimateMinDays','estimateMaxDays','pins']);$this->settings(true);
  if($id)CustomerSecurity::version($q,$this->r->one('SELECT * FROM delivery_zones WHERE id=? FOR UPDATE',[$id]));
  $v=['name'=>CatalogueRules::text($b['name']??null,200,true),'status'=>$b['status']??null,'cod_enabled'=>self::boolean($b['codEnabled']??false)];if(!in_array($v['status'],['active','inactive'],true))CommerceRules::fail('VALIDATION_FAILED','Invalid zone status.');
  foreach(['shippingPaise'=>'shipping_paise','minimumOrderPaise'=>'minimum_order_paise','freeShippingThresholdPaise'=>'free_shipping_threshold_paise']as $k=>$c)$v[$c]=CommerceRules::money($b[$k]??null,true);
  $v['estimate_min_days']=self::bounded($b['estimateMinDays']??null,365);$v['estimate_max_days']=self::bounded($b['estimateMaxDays']??null,365);if(($v['estimate_min_days']===null)!==($v['estimate_max_days']===null)||($v['estimate_min_days']!==null&&$v['estimate_min_days']>$v['estimate_max_days']))CommerceRules::fail('VALIDATION_FAILED','Supply both estimate bounds in order, or leave both empty.');
  $pins=$b['pins']??[];if(!is_array($pins)||count($pins)>1000)CommerceRules::fail('VALIDATION_FAILED','At most 1000 PINs per zone.');$seen=[];$rows=[];
  foreach($pins as $p){if(!is_array($p))CommerceRules::fail('VALIDATION_FAILED','Invalid PIN entry.');Request::allowFields($p,['postalCode','latitude','longitude','coverageRadiusM']);$pin=CommerceRules::pin($p['postalCode']??null);if(isset($seen[$pin]))CommerceRules::fail('VALIDATION_FAILED','Duplicate PIN.');$seen[$pin]=true;$other=$this->r->query('SELECT zone_id FROM delivery_zone_pins WHERE postal_code=?',[$pin])->fetchColumn();if($other&&$other!==$id)CommerceRules::fail('PIN_CONFLICT','This PIN already belongs to another zone.',409);$lat=$p['latitude']??null;$lng=$p['longitude']??null;$radius=self::bounded($p['coverageRadiusM']??null,20000000);if($lat!==null||$lng!==null||$radius!==null){self::coordinates($lat,$lng);if($radius===null)CommerceRules::fail('VALIDATION_FAILED','PIN coverage radius is required with coordinates.');}$rows[]=['postal_code'=>$pin,'latitude'=>$lat,'longitude'=>$lng,'coverage_radius_m'=>$radius];}
  if($id){$this->r->update('delivery_zones',$id,$v);$this->r->query('DELETE FROM delivery_zone_pins WHERE zone_id=?',[$id]);}else{$id=CatalogueRepository::id();$this->r->insert('delivery_zones',['id'=>$id]+$v);}
  foreach($rows as $row)$this->r->insert('delivery_zone_pins',$row+['zone_id'=>$id]);$this->r->query("UPDATE delivery_settings SET version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE id='delivery-settings'");return $this->view()+['savedZoneId'=>$id];
 }
}
