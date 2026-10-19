<?php
declare(strict_types=1);
namespace Virasat;
final class UploadPolicy {
 // Inspection only; no endpoint, persistence or claim of malware scanning.
 public static function inspect(string $path,int $maxImage,int $maxVideo):array{
  if(!is_uploaded_file($path))throw new \InvalidArgumentException('Expected HTTP upload.');
  $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($path);$images=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
  $ext=$images[$mime]??($mime==='video/mp4'?'mp4':null);$size=filesize($path);
  if(!$ext||$size===false||$size<1||$size>(isset($images[$mime])?$maxImage:$maxVideo))throw new \InvalidArgumentException('Unsupported media.');
  if(isset($images[$mime])&&getimagesize($path)===false)throw new \InvalidArgumentException('Invalid image.');
  return ['mime'=>$mime,'bytes'=>$size,'extension'=>$ext,'storageName'=>bin2hex(random_bytes(24)).'.'.$ext,'status'=>'quarantine'];
 }
}
