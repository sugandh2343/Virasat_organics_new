<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap/load.php';
try{
 // Optional separate migration account; never upload this configuration publicly.
 $path=dirname(__DIR__).'/config/migration.php';
 $config=is_file($path)?\Virasat\Configuration::load($path):\Virasat\Configuration::load(dirname(__DIR__).'/config/config.php');
 $runner=new \Virasat\MigrationRunner(\Virasat\Database::connect($config['db']),dirname(__DIR__).'/database');
 if(($argv[1]??'')==='--verify')$runner->assertReady();
 elseif(($argv[1]??'')==='--apply')$runner->migrate();
 else throw new RuntimeException('Use --verify or --apply.');
 fwrite(STDOUT,"Migration verification passed.\n");
}catch(Throwable $e){fwrite(STDERR,"Migration failed: ".get_class($e).". Check private configuration/schema against the manifest; no HTTP runner exists.\n");exit(1);}
