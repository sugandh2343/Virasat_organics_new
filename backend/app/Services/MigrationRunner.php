<?php
declare(strict_types=1);
namespace Virasat;
final class MigrationRunner {
 private \PDO $pdo;private string $root;private array $manifest;private bool $maria=false;
 public function __construct(\PDO $pdo,string $root){
  $this->pdo=$pdo;$this->root=$root;
  $this->manifest=json_decode((string)file_get_contents($root.'/manifest.json'),true,512,JSON_THROW_ON_ERROR);
 }
 public static function flavor(string $version):string{
  $maria=stripos($version,'mariadb')!==false;
  $pattern=$maria?'/(\d+\.\d+\.\d+)-MariaDB/i':'/^(\d+\.\d+\.\d+)/';
  if(!preg_match($pattern,$version,$m)||version_compare($m[1],$maria?'10.11.0':'8.0.16','<'))throw new \RuntimeException('MySQL 8.0.16+ or MariaDB 10.11+ is required.');
  return $maria?'mariadb':'mysql';
 }
 public function supportedVersion():void{
  $this->maria=self::flavor((string)$this->pdo->query('SELECT VERSION()')->fetchColumn())==='mariadb';
  if($this->maria&&(int)$this->pdo->query('SELECT @@SESSION.check_constraint_checks')->fetchColumn()!==1)throw new \RuntimeException('CHECK enforcement disabled.');
 }
 private function records():array{
  $result=[];foreach($this->pdo->query('SELECT version,checksum FROM schema_migrations')as $row)$result[$row['version']]=$row['checksum'];return $result;
 }
 private static function type(string $value):string{
  $value=strtolower($value);$value=preg_replace('/\b(bigint|int|smallint|tinyint)\(\d+\)/','$1',$value);
  return str_replace('boolean','tinyint',$value);
 }
 public function verifySchema(bool $foreign=true):void{
  $this->supportedVersion();$columns=[];$indexes=[];$constraints=[];$refs=[];$jsonChecks=[];
  foreach($this->pdo->query('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()')as $r)$columns[$r['TABLE_NAME']][$r['COLUMN_NAME']]=$r;
  foreach($this->pdo->query('SELECT TABLE_NAME,INDEX_NAME,COLUMN_NAME,SEQ_IN_INDEX,NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY SEQ_IN_INDEX')as $r){
   $indexes[$r['TABLE_NAME']][$r['INDEX_NAME']]['columns'][]=$r['COLUMN_NAME'];$indexes[$r['TABLE_NAME']][$r['INDEX_NAME']]['unique']=!$r['NON_UNIQUE'];
  }
  $enforced=$this->maria?"'YES' AS ENFORCED":"ENFORCED";
  foreach($this->pdo->query("SELECT TABLE_NAME,CONSTRAINT_NAME,".$enforced." FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='CHECK'")as $r)$constraints[$r['TABLE_NAME']][$r['CONSTRAINT_NAME']]=$r['ENFORCED'];
  if($this->maria)foreach($this->pdo->query("SELECT TABLE_NAME,CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE()")as $r)$jsonChecks[$r['TABLE_NAME']][]=strtolower(str_replace([chr(96),' '],'',$r['CHECK_CLAUSE']));
  if($foreign)foreach($this->pdo->query('SELECT TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL')as $r)$refs[$r['TABLE_NAME']][$r['CONSTRAINT_NAME']]=$r;
  foreach($this->manifest['tables']as $table=>$schema){
   foreach($schema['columns']as $column=>$definition){
    $actual=$columns[$table][$column]??null;
    preg_match('/^([A-Z]+(?:\(\d+(?:,\d+)?\))?(?: UNSIGNED)?)/',$definition,$m);
    $nullable=strpos($definition,'NOT NULL')===false&&strpos($definition,'PRIMARY KEY')===false;
    $typeMatches=$actual && self::type($actual['COLUMN_TYPE'])===self::type($m[1]);
    if($this->maria && $m[1]==='JSON' && $actual && strtolower($actual['COLUMN_TYPE'])==='longtext'){
     foreach($jsonChecks[$table]??[] as $clause)if(strpos($clause,'json_valid('.$column.')')!==false)$typeMatches=true;
    }
    if(!$actual||!$typeMatches||($actual['IS_NULLABLE']==='YES')!==$nullable)throw new \RuntimeException('Schema column mismatch.');
    if(strpos($definition,'PRIMARY KEY')!==false&&($indexes[$table]['PRIMARY']['columns']??[])!==[$column])throw new \RuntimeException('Primary key mismatch.');
   }
   foreach($schema['extra']as $definition){
    if(preg_match('/^(UNIQUE KEY|KEY|PRIMARY KEY)\s*(?:(\w+)\s*)?\(([^)]+)\)/',$definition,$m)){
     $name=$m[1]==='PRIMARY KEY'?'PRIMARY':$m[2];$expected=explode(',',str_replace(' ','',$m[3]));$actual=$indexes[$table][$name]??null;
     if(!$actual||$actual['columns']!==$expected||$actual['unique']!==($m[1]!=='KEY'))throw new \RuntimeException('Schema index mismatch.');
    }
    if(preg_match('/^CONSTRAINT (\w+) CHECK/',$definition,$m)&&($constraints[$table][$m[1]]??'')!=='YES')throw new \RuntimeException('Schema check missing or unenforced.');
   }
   if($foreign)foreach($schema['foreign']as $ref){
    $actual=$refs[$table][$ref['name']]??null;
    if(!$actual||$actual['COLUMN_NAME']!==$ref['column']||$actual['REFERENCED_TABLE_NAME']!==$ref['target']||$actual['REFERENCED_COLUMN_NAME']!==$ref['targetColumn'])throw new \RuntimeException('Foreign key mismatch.');
   }
  }
  foreach($this->pdo->query('SELECT TABLE_NAME,ENGINE,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')as $r)if(isset($this->manifest['tables'][$r['TABLE_NAME']])&&($r['ENGINE']!=='InnoDB'||strpos($r['TABLE_COLLATION'],'utf8mb4_')!==0))throw new \RuntimeException('Table engine/collation mismatch.');
 }
 private function checkedFile(array $migration):string{
  $sql=file_get_contents($this->root.'/'.$migration['file']);
  if($sql===false||!hash_equals($migration['sha256'],hash('sha256',$sql)))throw new \RuntimeException('Migration file checksum mismatch.');
  return $sql;
 }
 public function assertReady():void{
  $this->supportedVersion();$records=$this->records();
  foreach($this->manifest['migrations']as $m){$this->checkedFile($m);if(($records[$m['version']]??null)!==$m['sha256'])throw new \RuntimeException('Migration pending or changed.');}
  $this->verifySchema();
  $q=$this->pdo->prepare('SELECT id FROM products WHERE id=?');
  foreach($this->manifest['seedProductIds']as $id){$q->execute([$id]);if(!$q->fetch())throw new \RuntimeException('Core catalogue seed missing.');$q->closeCursor();}
 }
 public function migrate():void{
  if(PHP_SAPI!=='cli')throw new \RuntimeException('CLI only.');
  $this->supportedVersion();
  if((int)$this->pdo->query("SELECT GET_LOCK('virasat_schema_migrations',10)")->fetchColumn()!==1)throw new \RuntimeException('Migration lock unavailable.');
  try{
   // Bootstrap tracker with the exact first statement of the immutable schema file.
   $first=$this->checkedFile($this->manifest['migrations'][0]);$this->pdo->exec(explode(';',$first)[0]);
   $records=$this->records();
   foreach($this->manifest['migrations']as $m){
    $sql=$this->checkedFile($m);
    if(isset($records[$m['version']])){
     if(!hash_equals($m['sha256'],$records[$m['version']]))throw new \RuntimeException('Applied migration was modified.');continue;
    }
    $started=microtime(true);
    // These generated SQL files contain no semicolons in strings or stored routines.
    foreach(explode(';',$sql)as $statement)if(trim($statement)!==''){$result=$this->pdo->query($statement);if($result)$result->closeCursor();}
    $this->verifySchema($m['version']!=='001_tables');
    $q=$this->pdo->prepare('INSERT INTO schema_migrations(version,checksum,applied_at,execution_ms) VALUES(?,?,UTC_TIMESTAMP(6),?)');
    $q->execute([$m['version'],$m['sha256'],(int)((microtime(true)-$started)*1000)]);
   }
   $this->assertReady();
  }catch(\Throwable $e){if($this->pdo->inTransaction())$this->pdo->rollBack();throw $e;}
  finally{$this->pdo->query("SELECT RELEASE_LOCK('virasat_schema_migrations')")->closeCursor();}
 }
}
