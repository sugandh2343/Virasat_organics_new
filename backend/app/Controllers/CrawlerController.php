<?php
declare(strict_types=1);
namespace Virasat;
final class CrawlerController {
 private array $c;public function __construct(array $c){$this->c=$c;}
 public function register(Router $r):void{$r->add('GET','/api/sitemap.xml',fn()=>$this->sitemap());}
 public static function xml(array $urls):string {$out='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';foreach($urls as $url)$out.='<url><loc>'.htmlspecialchars($url,ENT_XML1|ENT_QUOTES,'UTF-8').'</loc></url>';return $out.'</urlset>';}
 public function sitemap():array {
  $r=new CatalogueRepository(Database::connect($this->c['db']));$paths=['/shop'];
  if((int)$r->query('SELECT COUNT(*) FROM homepage_sections WHERE published_content IS NOT NULL')->fetchColumn()===10)$paths[]='/';
  foreach([['products',"status IN ('active','out_of_stock','coming_soon')",'/product/'],['categories',"status='active'",'/shop/category/'],['blog_posts',"status='published'",'/blog/'],['cms_pages',"status='published'",'/']]as [$table,$where,$prefix])foreach($r->query('SELECT slug FROM '.$table.' WHERE '.$where.' ORDER BY slug LIMIT 10000')->fetchAll(\PDO::FETCH_COLUMN)as $slug)$paths[]=$prefix.rawurlencode($slug);
  if(count(array_filter($paths,fn($p)=>strpos($p,'/blog/')===0)))$paths[]='/blog';
  header('Content-Type: application/xml; charset=utf-8');header('Cache-Control: public, max-age=300');header('X-Content-Type-Options: nosniff');echo self::xml(array_map(fn($p)=>$this->c['app_origin'].$p,array_unique($paths)));exit;
 }
}
