<?php
declare(strict_types=1);
// Offline SQL generator only: no public endpoint, no connection, no default account.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
try{
 $v=json_decode((string)stream_get_contents(STDIN),true,8,JSON_THROW_ON_ERROR);
 if(!filter_var($v['email']??'',FILTER_VALIDATE_EMAIL)||!is_string($v['name']??null)||strlen($v['name'])<1||strlen($v['name'])>200||!is_string($v['password']??null)||strlen($v['password'])<16||strlen($v['password'])>72)throw new RuntimeException();
 $id=bin2hex(random_bytes(16));$role=bin2hex(random_bytes(16));
 $hex=fn(string $s)=>"CONVERT(0x".bin2hex($s)." USING utf8mb4)";
 $email=$hex(strtolower($v['email']));$name=$hex($v['name']);$hash=$hex(password_hash($v['password'],PASSWORD_DEFAULT));unset($v);
 echo "-- Private one-time bootstrap: import only into the dedicated V2 database.\n";
 echo "SET @locked=GET_LOCK('virasat_initial_admin',10);\nSTART TRANSACTION;\n";
 echo "SET @allowed=(@locked=1 AND NOT EXISTS(SELECT 1 FROM admin_users));\n";
 echo "INSERT INTO admin_permissions(permission_key) SELECT 'catalogue.write' WHERE @allowed ON DUPLICATE KEY UPDATE permission_key=VALUES(permission_key);\n";
 echo "INSERT INTO admin_roles(id,role_key,name) SELECT '$role','catalogue-".$role."','Catalogue administrator' WHERE @allowed;\n";
 echo "INSERT INTO admin_users(id,email,name,password_hash,status) SELECT '$id',$email,$name,$hash,'active' WHERE @allowed;\n";
 echo "INSERT INTO admin_user_roles(admin_user_id,role_id) SELECT '$id','$role' WHERE @allowed;\n";
 echo "INSERT INTO admin_role_permissions(role_id,permission_key) SELECT '$role','catalogue.write' WHERE @allowed;\n";
 echo "COMMIT;\nSELECT @allowed AS admin_created;\nSELECT RELEASE_LOCK('virasat_initial_admin');\n";
}catch(Throwable $e){fwrite(STDERR,"Provide private JSON on stdin with email, name and a 16–72 byte password. No SQL generated.\n");exit(1);}
