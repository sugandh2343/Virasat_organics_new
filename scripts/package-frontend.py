from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
assert (dist/'index.html').is_file() and (dist/'.htaccess').is_file(), 'Build first'
# Public source documentation and empty-directory markers are not deployment assets.
for f in dist.rglob('*'):
 if f.is_file() and (f.suffix=='.md' or f.name=='.gitkeep'):
  assert f.resolve().is_relative_to(dist.resolve())
  f.unlink()
files=sorted(f for f in dist.rglob('*') if f.is_file())
allowed={'.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff','.woff2','.ttf','.mp4','.webm'}
for f in files:
 assert f.name=='.htaccess' or f.suffix in allowed, 'Unexpected deployment file type'
 assert not any(x in f.relative_to(dist).parts for x in ['api','backend','node_modules','src','scripts']), 'Private/source directory in build'
out=root/'deployment';out.mkdir(exist_ok=True)
archive=out/'virasat-frontend-phase7c.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for f in files:z.write(f,f.relative_to(dist).as_posix())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert set(z.namelist())=={f.relative_to(dist).as_posix() for f in files}
 assert 'index.html' in z.namelist() and '.htaccess' in z.namelist()
manifest={'archive':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':{f.relative_to(dist).as_posix():hashlib.sha256(f.read_bytes()).hexdigest() for f in files}}
(out/'frontend-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'PASS: {len(files)} frontend files; ZIP contents match dist; {archive.stat().st_size} bytes. No backend, environment files, private keys, source maps or developer scripts.')
