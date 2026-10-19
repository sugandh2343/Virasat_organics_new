<?php
declare(strict_types=1);
namespace Virasat;
final class CatalogueMedia {
 private CatalogueRepository $r;private string $root;private string $actor;private string $requestId;
 public function __construct(CatalogueRepository $r,string $actor,string $requestId){
  $this->r=$r;$this->actor=$actor;$this->requestId=$requestId;$this->root=dirname(__DIR__,2).'/storage/media';
 }
 public static function filename(string $key):string{
  if(!preg_match('/^[a-f0-9]{48}\.(jpg|png|webp|mp4)$/D',$key))throw new HttpError(400,'UNSAFE_PATH','Invalid storage key.');return $key;
 }
 public static function inspect(string $path,int $size):array{
  if($size<=0||$size>100*1024*1024)throw new HttpError(413,'TOO_LARGE','Maximum MP4 size is 100 MB.');
  $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($path);
  $extensions=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','video/mp4'=>'mp4'];
  if(!isset($extensions[$mime]))throw new HttpError(415,'UNSUPPORTED_MEDIA','Use JPEG, PNG, WebP or MP4.');
  $width=null;$height=null;
  if($mime!=='video/mp4'){
   if($size>10*1024*1024)throw new HttpError(413,'TOO_LARGE','Maximum image size is 10 MB.');
   $info=@getimagesize($path);
   if(!$info||$info['mime']!==$mime||$info[0]*$info[1]>16000000)throw new HttpError(422,'INVALID_IMAGE','Invalid image or more than 16 megapixels.');
   [$width,$height]=$info;
  }else{
   $f=fopen($path,'rb');$head=fread($f,32);fclose($f);
   if(strlen($head)<12||substr($head,4,4)!=='ftyp')throw new HttpError(422,'INVALID_VIDEO','MP4 container required.');
  }
  return ['mime'=>$mime,'extension'=>$extensions[$mime],'width'=>$width,'height'=>$height];
 }
 public function upload():array{
  if(!isset($_FILES['files'])||!is_array($_FILES['files']['tmp_name']))CatalogueRules::fail('Upload files[] as multipart data.');
  $files=$_FILES['files'];$count=count($files['tmp_name']);if($count<1||$count>10)CatalogueRules::fail('Upload 1–10 files.');
  if(!is_dir($this->root)&&!mkdir($this->root,0700,true))throw new \RuntimeException('Media storage unavailable.');
  $written=[];$out=[];$this->r->db->beginTransaction();
  try{
   for($i=0;$i<$count;$i++){
    if(($files['error'][$i]??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||!is_uploaded_file($files['tmp_name'][$i]))CatalogueRules::fail('Upload failed; check hosting size limits.');
    $tmp=$files['tmp_name'][$i];$meta=self::inspect($tmp,(int)filesize($tmp));$key=bin2hex(random_bytes(24)).'.'.$meta['extension'];$dest=$this->root.'/'.$key;
    $written[]=$dest;
    if($meta['mime']==='video/mp4'){if(!move_uploaded_file($tmp,$dest))throw new \RuntimeException('Upload move failed.');}
    else{
     if(!function_exists('imagecreatefromstring'))throw new HttpError(503,'GD_REQUIRED','Enable PHP GD for image uploads.');
     $image=@imagecreatefromstring(file_get_contents($tmp));if(!$image)CatalogueRules::fail('Image decoding failed.');
     try{
      imagealphablending($image,false);imagesavealpha($image,true);
      $ok=$meta['extension']==='jpg'?imagejpeg($image,$dest,90):($meta['extension']==='png'?imagepng($image,$dest):imagewebp($image,$dest,90));
      if(!$ok)throw new \RuntimeException('Image encoding failed.');
     }finally{imagedestroy($image);}
    }
    chmod($dest,0600);$id=CatalogueRepository::id();
    $this->r->insert('media_assets',['id'=>$id,'owner_admin_id'=>$this->actor,'storage_key'=>$key,'original_name'=>CatalogueRules::text(basename(str_replace('\\','/',$files['name'][$i])),200,true),'mime_type'=>$meta['mime'],'bytes'=>filesize($dest),'kind'=>$meta['mime']==='video/mp4'?'video':'image','width'=>$meta['width'],'height'=>$meta['height'],'status'=>'ready','checksum_sha256'=>hash_file('sha256',$dest)]);
    $this->r->audit($this->actor,'upload','media',$id,$this->requestId);$out[]=CatalogueRepository::media($this->r->one('SELECT * FROM media_assets WHERE id=?',[$id]));
   }
   $this->r->db->commit();return $out;
  }catch(\Throwable $e){if($this->r->db->inTransaction())$this->r->db->rollBack();foreach($written as $file)if(is_file($file))unlink($file);throw $e;}
 }
 public function edit(string $id,array $v,Request $request,bool $delete=false):array{
  Request::allowFields($v,['alt','caption','posterMediaId']);
  $this->r->db->beginTransaction();
  try{
   $m=$this->r->one('SELECT * FROM media_assets WHERE id=? FOR UPDATE',[$id]);
   if($request->header('If-Match')!==(string)$m['version'])throw new HttpError(409,'VERSION_CONFLICT','Reload media before editing.');
   if($delete)$this->r->query('DELETE FROM media_assets WHERE id=?',[$id]);
   else{
    if(array_key_exists('posterMediaId',$v)){
     if($m['kind']!=='video')CatalogueRules::fail('Only videos have posters.');
     $poster=$v['posterMediaId']?:null;
     if($poster)$this->r->one("SELECT id FROM media_assets WHERE id=? AND kind='image' AND status='ready' FOR UPDATE",[CatalogueRules::text($poster,64,true)]);
     if($poster&&!$this->r->query('SELECT 1 FROM product_videos WHERE media_asset_id=? LIMIT 1',[$id])->fetchColumn())CatalogueRules::fail('Assign this video to a product before setting its poster.');
     $this->r->query('UPDATE product_videos SET poster_media_asset_id=?,version=version+1,updated_at=UTC_TIMESTAMP(6) WHERE media_asset_id=?',[$poster,$id]);
     unset($v['posterMediaId']);
    }
    $values=[];foreach($v as $key=>$value)$values[$key]=CatalogueRules::text($value,2000);
    if($values)$this->r->update('media_assets',$id,$values);
   }
   $this->r->audit($this->actor,$delete?'delete':'update','media',$id,$this->requestId);$this->r->db->commit();
  }catch(\Throwable $e){if($this->r->db->inTransaction())$this->r->db->rollBack();if($e instanceof \PDOException&&$e->getCode()==='23000')throw new HttpError(409,'REFERENCED_RESOURCE','Unassign media from all products, categories and content first.');throw $e;}
  // Keep unreferenced bytes private after metadata deletion; operator garbage collection
  // avoids a filesystem failure turning a committed deletion into a false API failure.
  return $delete?['deleted'=>true]:CatalogueRepository::media($this->r->one('SELECT * FROM media_assets WHERE id=?',[$id]));
 }
 public function serve(string $id,Request $request):void{
  $m=$this->r->one("SELECT * FROM media_assets WHERE id=? AND status='ready'",[$id]);
  $visible=$this->r->query("SELECT 1 FROM product_images a JOIN products p ON p.id=a.product_id WHERE a.media_asset_id=? AND p.status IN ('active','out_of_stock','coming_soon') UNION SELECT 1 FROM product_videos a JOIN products p ON p.id=a.product_id WHERE (a.media_asset_id=? OR a.poster_media_asset_id=?) AND p.status IN ('active','out_of_stock','coming_soon') UNION SELECT 1 FROM categories WHERE image_media_asset_id=? AND status='active' LIMIT 1",[$id,$id,$id,$id])->fetchColumn();
  if(!$visible)$visible=(new CMSService($this->r))->mediaVisible($id);
  if(!$visible&&$this->actor==='')throw new HttpError(404,'NOT_FOUND','Media unavailable.');
  $file=$this->root.'/'.self::filename($m['storage_key']);if(!is_file($file))throw new HttpError(404,'NOT_FOUND','Media file unavailable.');
  $size=filesize($file);$start=0;$end=$size-1;$range=$request->header('Range');
  if($range!==''){
   if(!preg_match('/^bytes=(\d*)-(\d*)$/D',$range,$match)||($match[1]===''&&$match[2]==='')){header('Content-Range: bytes */'.$size);http_response_code(416);exit;}
   if($match[1]==='')$start=max(0,$size-(int)$match[2]);else{$start=(int)$match[1];if($match[2]!=='')$end=min($end,(int)$match[2]);}
   if($start>$end||$start>=$size){header('Content-Range: bytes */'.$size);http_response_code(416);exit;}
   http_response_code(206);header("Content-Range: bytes $start-$end/$size");
  }
  header('Content-Type: '.$m['mime_type']);header('X-Content-Type-Options: nosniff');header("Content-Security-Policy: default-src 'none'; sandbox");header('Content-Disposition: inline; filename="'.$m['storage_key'].'"');header('Cache-Control: private, no-store');header('Accept-Ranges: bytes');header('Content-Length: '.($end-$start+1));
  if(session_status()===PHP_SESSION_ACTIVE)session_write_close();
  $f=fopen($file,'rb');fseek($f,$start);$remaining=$end-$start+1;
  while($remaining>0&&!feof($f)){ $chunk=fread($f,min(65536,$remaining));if($chunk===false||$chunk==='')break;echo $chunk;$remaining-=strlen($chunk);}
  fclose($f);exit;
 }
}
