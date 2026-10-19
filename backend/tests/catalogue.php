<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap/load.php';
use Virasat\{CatalogueRules as R,CatalogueMedia,Router,Request,CatalogueController,HttpError};
$n=0;
function ok(bool $v):void{global $n;if(!$v)throw new RuntimeException('Assertion '.($n+1));$n++;}
function rejects(callable $fn):void{try{$fn();}catch(Throwable $e){ok(true);return;}throw new RuntimeException('Expected rejection');}
foreach(['active','out_of_stock','coming_soon']as $s)ok(R::visible($s));
ok(!R::visible('inactive'));ok(!R::visible('invented'));
foreach(['inactive','out_of_stock','coming_soon']as $s)ok(!R::purchasable(['status'=>$s,'pricePaise'=>100,'stock'=>5]));
ok(R::purchasable(['status'=>'active','pricePaise'=>0,'stock'=>1]));
foreach([[null,2],[100,null],[100,0]]as [$p,$s])ok(!R::purchasable(['status'=>'active','pricePaise'=>$p,'stock'=>$s]));
$v=['name'=>'Test','slug'=>'test','sku'=>'TEST','size'=>'500 ml','categoryId'=>'category-oils','status'=>'coming_soon'];
ok(R::product($v)['pricePaise']===null);
foreach([['variants'=>[]],['status'=>'invented'],['pricePaise'=>1.5],['pricePaise'=>200,'compareAtPricePaise'=>100],['slug'=>'../bad'],['imageIds'=>['a','a']]]as $patch)rejects(fn()=>R::product(array_replace($v,$patch)));
ok(R::stock(null,0,'set',5)===5);ok(R::stock(5,1,'adjust',-2)===3);
rejects(fn()=>R::stock(null,0,'adjust',2));rejects(fn()=>R::stock(1,0,'adjust',-2));rejects(fn()=>R::stock(10,8,'set',7));
rejects(fn()=>R::page(['page'=>0]));rejects(fn()=>R::page(['pageSize'=>101]));
ok(R::page(['page'=>'2'])['page']===2);
foreach(['../test.jpg','test.php',str_repeat('a',48).'.php']as $path)rejects(fn()=>CatalogueMedia::filename($path));
ok(CatalogueMedia::filename(str_repeat('a',48).'.jpg')===str_repeat('a',48).'.jpg');
rejects(fn()=>CatalogueMedia::inspect('',0));rejects(fn()=>CatalogueMedia::inspect('',100*1024*1024+1));
foreach(['/api/products','/api/products/atta-5kg','/api/categories/atta-flour','/api/admin/products/a/duplicate','/api/admin/media/a','/api/admin/inventory/adjustments']as $path){
 $router=new Router();$req=new Request(['REQUEST_URI'=>$path]);(new CatalogueController([],$req,'test'))->register($router);ok(count($router->methods($path))>0);
}
$router=new Router();$req=new Request(['REQUEST_URI'=>'/api/admin/bootstrap']);(new CatalogueController([],$req,'test'))->register($router);ok($router->methods($req->path)===[]);

if(class_exists('finfo')){
 $tmp=tempnam(sys_get_temp_dir(),'virasat-media-');
 try{file_put_contents($tmp,'<?php echo "unsafe";');rejects(fn()=>CatalogueMedia::inspect($tmp,(int)filesize($tmp)));}
 finally{unlink($tmp);}
}
echo "PASS: $n catalogue validation/status/routing/path assertions. No database tests claimed.\n";
