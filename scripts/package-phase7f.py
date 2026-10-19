from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
backend=['app/Services/CMSRules.php', 'app/Services/CMSService.php', 'app/Controllers/CMSController.php', 'config/home-schema.json', 'app/Helpers/Http.php', 'app/Services/AdminAuth.php', 'app/Controllers/CatalogueController.php', 'app/Services/CatalogueMedia.php', 'app/Services/CommerceService.php', 'app/Controllers/CommerceController.php', 'bootstrap/load.php', 'bootstrap/app.php']
dist=root/'dist';assert (dist/'index.html').is_file() and (dist/'.htaccess').is_file()
for f in dist.rglob('*'):
 if f.is_file() and (f.suffix=='.md' or f.name=='.gitkeep'):
  assert f.resolve().is_relative_to(dist.resolve());f.unlink()
front=sorted(f.relative_to(dist).as_posix() for f in dist.rglob('*') if f.is_file())
assert 'index.html' in front and '.htaccess' in front
assert all(n=='.htaccess' or Path(n).suffix in {'.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff','.woff2','.ttf','.mp4','.webm'} for n in front)
assert all(not n.startswith(('api/','backend/','src/','scripts/','node_modules/')) for n in front)
packages=[(root/'backend/deployment/phase7f-cms-incremental.zip',root/'backend',backend),(root/'deployment/virasat-frontend-phase7f.zip',dist,front)]
manifest={}
for target,base,names in packages:
 target.parent.mkdir(exist_ok=True,parents=True)
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for name in names:
   assert name!='config/config.php' and not name.startswith('.env')
   z.write(base/name,name)
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None and set(z.namelist())==set(names)
  for n in names: assert z.read(n)==(base/n).read_bytes()
 manifest[str(target.relative_to(root)).replace('\\','/') ]={'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'files':{n:hashlib.sha256((base/n).read_bytes()).hexdigest() for n in names}}
(root/'deployment/phase7f-checksums.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('PASS: frontend and twelve-file PHP/CMS packages verified against source; migrations remain separate; no private config or secrets packaged.')
