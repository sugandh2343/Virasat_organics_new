<?php
declare(strict_types=1);
namespace Virasat;
final class Database {
 public static function connect(array $c):\PDO{
  foreach(['host','name','user','password']as $key)if(!is_string($c[$key]??null)||$c[$key]==='')throw new \RuntimeException('Database unconfigured.');
  foreach(['host','name']as $key)if(!preg_match('/^[a-zA-Z0-9_.-]+$/D',$c[$key]))throw new \RuntimeException('Invalid DB setting.');
  $port=$c['port']??3306;if(!is_int($port)||$port<1||$port>65535)throw new \RuntimeException('Invalid DB port.');
  $pdo=new \PDO('mysql:host='.$c['host'].';port='.$port.';dbname='.$c['name'].';charset=utf8mb4',$c['user'],$c['password'],[
   \PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_DEFAULT_FETCH_MODE=>\PDO::FETCH_ASSOC,\PDO::ATTR_EMULATE_PREPARES=>false,\PDO::ATTR_TIMEOUT=>max(1,min(10,(int)($c['connect_timeout']??5))),\PDO::MYSQL_ATTR_MULTI_STATEMENTS=>false]);
  $pdo->exec("SET time_zone = '+00:00'");$pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");return $pdo;
 }
}
