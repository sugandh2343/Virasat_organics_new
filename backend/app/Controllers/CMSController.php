<?php
declare(strict_types=1);
namespace Virasat;
final class CMSController {
 private array $c;private Request $q;private string $id;
 public function __construct(array $c,Request $q,string $id){$this->c=$c;$this->q=$q;$this->id=$id;}
 public function register(Router $r):void{
  foreach(['/api/store','/api/homepage','/api/banners','/api/blog','/api/blog/categories','/api/story','/api/settings/public']as $path)$r->add('GET',$path,fn()=>$this->dispatch($path));
  foreach(['blog','pages']as $kind)if(preg_match('#^/api/'.$kind.'/([a-z0-9-]{1,120})$#D',$this->q->path,$m)&&$this->q->path!=='/api/blog/categories')$r->add('GET',$this->q->path,fn()=>$this->dispatch('/api/'.$kind,$m[1]));
  foreach(['homepage','settings','blog','pages','banners','blog-categories']as $kind){$base='/api/admin/'.$kind;if($this->q->path===$base)foreach(['GET',in_array($kind,['homepage','settings'],true)?'PUT':'POST']as $method)$r->add($method,$base,fn()=>$this->dispatch($base));if(preg_match('#^'.preg_quote($base,'#').'/([a-zA-Z0-9_-]{1,64})$#D',$this->q->path,$m)&&!in_array($kind,['homepage','settings'],true))foreach(['GET','PATCH','DELETE']as $method)$r->add($method,$this->q->path,fn()=>$this->dispatch($base,$m[1]));}
 }
 private function dispatch(string $path,?string $id=null):array{
  $admin=strpos($path,'/api/admin/')===0;$write=$this->q->method!=='GET';if($admin){(new AdminAuth($this->c,$this->q))->start();if(empty($_SESSION['admin_id']))throw new HttpError(401,'UNAUTHENTICATED','Admin login required.');if($write)SessionSecurity::requireCsrf($this->q,$this->c);}
  $r=new CatalogueRepository(Database::connect($this->c['db']));$actor=$admin?AdminAuthorization::requirePermission($r->db,$path==='/api/admin/settings'?'settings.write':'content.write'):'';
  if($write)CustomerSecurity::rate($r,'cms:'.$actor,60);$s=new CMSService($r,$actor,$this->id);$filters=[];parse_str(parse_url($this->q->server['REQUEST_URI']??'',PHP_URL_QUERY)??'',$filters);foreach($filters as $v)if(!is_string($v))CatalogueRules::fail('Invalid filters.');
  $body=$write&&$this->q->method!=='DELETE'?json_decode(json_encode($this->q->json(262144),JSON_THROW_ON_ERROR),true,64,JSON_THROW_ON_ERROR):[];$envelope=null;
  if($path==='/api/admin/homepage')$out=$write?$s->saveHome($body,$this->q):$s->homepage(true);
  elseif($path==='/api/admin/settings'||$path==='/api/settings/public')$out=$write?$s->saveBusiness($body,$this->q):$s->business($admin);
  elseif($path==='/api/homepage')$out=$s->homepage();
  elseif($path==='/api/store')$out=['homepage'=>$s->homepage(),'banners'=>$s->list('banners',['pageSize'=>'100'])['data'],'editorialPreviews'=>$s->list('blog',['pageSize'=>'100'])['data']];
  elseif($path==='/api/story')$out=$s->get('pages','our-story');
  else{$kind=$path==='/api/blog/categories'?'blog-categories':basename($path);if($write)$out=$this->q->method==='DELETE'?$s->delete($kind,$id,$this->q):$s->save($kind,$body,$id,$this->q);elseif($id)$out=$s->get($kind,$id,$admin);else{$envelope=$s->list($kind,$filters,$admin);$out=$envelope['data'];}}
  $result=['__catalogue'=>$envelope??['data'=>$out]];
  if(!$admin){$tag='"'.hash('sha256',json_encode($result['__catalogue'],JSON_THROW_ON_ERROR)).'"';$result['__headers']=['Cache-Control'=>'public, max-age=0, must-revalidate','ETag'=>$tag];if($this->q->header('If-None-Match')===$tag)$result['__status']=304;}
  return $result;
 }
}
