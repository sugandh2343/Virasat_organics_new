import assert from 'node:assert/strict';
import { localApiOriginGuard } from './local-api-origin-guard.mjs';
function check(origin, host = 'localhost:5190', method = 'POST') {
  let accepted = false;
  const response = { statusCode: 200, setHeader() {}, end() {} };
  localApiOriginGuard({url:'/api/admin/login', method, headers:{origin,host}}, response, () => {accepted=true;});
  return accepted;
}
for (const scheme of ['http','https']) assert.ok(check(`${scheme}://localhost:5190`));
for (const origin of ['https://untrusted.example.invalid','http://localhost:5191','https://localhost:5190.evil.test','null',undefined]) assert.equal(check(origin),false);
assert.equal(check('https://evil.test','evil.test'),false);
assert.equal(check('https://localhost:5190','evil.test'),false);
assert.ok(check(undefined,'localhost:5190','GET'));
console.log('PASS: exact HTTP/HTTPS localhost:5190 origins; foreign origins, ports, hosts and missing mutation Origin rejected.');
for (const headers of [
 {':authority':'localhost:5190'},
 {':authority':'localhost:5190',origin:'https://localhost:5190'},
]) {
 let accepted=false;
 localApiOriginGuard({url:'/api/admin/session',method:'GET',headers},{setHeader(){},end(){}},()=>accepted=true);
 assert.ok(accepted,'HTTP/2 exact authority accepted without GET Origin');
}
for (const headers of [
 {':authority':'evil.test'},
 {host:'evil.test',':authority':'localhost:5190'},
 {host:'localhost:5190',':authority':'evil.test'},
 {':authority':'localhost:5191'},
]) {
 let accepted=false; let body;
 localApiOriginGuard({url:'/api/admin/session',method:'GET',headers},{setHeader(){},end(value){body=value;}},()=>accepted=true);
 assert.equal(accepted,false);
 assert.equal(JSON.parse(body).error.code,'LOCAL_ORIGIN_DENIED');
}
console.log('PASS: HTTP/2 authority, absent GET Origin, conflicting authority and JSON rejection.');