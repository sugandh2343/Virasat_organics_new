from pathlib import Path
import shutil,json,hashlib,zipfile
project=Path(__file__).resolve().parent.parent
source=project/'backend'
target=source/'deployment/upload'
allowed={}
for directory in ['app','bootstrap','database','bin']:
 for file in (source/directory).rglob('*'):
  if file.is_file():allowed['private/virasat-backend/'+file.relative_to(source).as_posix()]=file
for relative in ['config/config.example.php','.htaccess']:
 allowed['private/virasat-backend/'+relative]=source/relative
for file in (source/'deployment/public_html/api').iterdir():
 if file.is_file():allowed['public_html/api/'+file.name]=file
allowed['PHASE7A_HOSTINGER_BACKEND.md']=project/'PHASE7A_HOSTINGER_BACKEND.md'
# Reject stale/unexpected package files, never recursively erase a computed directory.
if target.exists():
 for file in target.rglob('*'):
  if file.is_file() and file.relative_to(target).as_posix() not in set(allowed)|{'PACKAGE_SHA256.json'}:raise RuntimeError('Unexpected package file: '+str(file))
hashes={}
for relative,file in allowed.items():
 dest=target/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,dest)
 hashes[relative]=hashlib.sha256(dest.read_bytes()).hexdigest()
for name in ['sessions','logs','quarantine']:(target/'private/virasat-backend/storage'/name).mkdir(parents=True,exist_ok=True)
(target/'PACKAGE_SHA256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
archive=source/'deployment/virasat-backend-upload.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED)as output:
 for file in target.rglob('*'):
  output.write(file,file.relative_to(target).as_posix()+('/' if file.is_dir() else ''))
with zipfile.ZipFile(archive)as output:
 assert output.testzip() is None
 assert 'public_html/api/.htaccess' in output.namelist()
 assert not any(name.endswith('/config.php')or name.endswith('/migration.php')for name in output.namelist())
print('Packaged',len(hashes),'allowlisted files; zip integrity verified:',archive)
