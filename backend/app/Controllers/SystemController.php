<?php
declare(strict_types=1);
namespace Virasat;
final class SystemController {
 private array $config;
 public function __construct(array $config){$this->config=$config;}
 public function health():array{return ['status'=>'ok','service'=>'virasat-api'];}
 public function ready():array{
  $pdo=Database::connect($this->config['db']);(new MigrationRunner($pdo,dirname(__DIR__,2).'/database'))->assertReady();RuntimeSchema::assertReady($pdo);return ['status'=>'ready'];
 }
}
