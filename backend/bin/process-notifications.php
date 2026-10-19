<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap/load.php';
try{$c=\Virasat\Configuration::load(dirname(__DIR__).'/config/config.php');$r=new \Virasat\CatalogueRepository(\Virasat\Database::connect($c['db']));$n=(new \Virasat\OperationNotifications($r))->sync(500);echo "In-app events processed: ".$n.". External delivery disabled.\n";}catch(Throwable $e){fwrite(STDERR,"Notification processing failed; inspect private operator logs.\n");exit(1);}
