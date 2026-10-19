<?php
declare(strict_types=1);
return [
 'environment'=>'production','require_https'=>true,'app_origin'=>'https://virasatorganics.com',
 'cors_origins'=>['https://virasatorganics.com'],'cors_credentials'=>false,'trusted_proxies'=>[],
 'db'=>['host'=>'','port'=>3306,'name'=>'','user'=>'','password'=>'','connect_timeout'=>5],
 'session'=>['name'=>'__Host-virasat_session','path'=>dirname(__DIR__).'/storage/sessions','idle_seconds'=>1800,'absolute_seconds'=>43200],
 'upload'=>['quarantine'=>dirname(__DIR__).'/storage/quarantine','max_image_bytes'=>10485760,'max_video_bytes'=>104857600],
];
