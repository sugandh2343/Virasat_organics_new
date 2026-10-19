from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent.parent
backend=root/'backend'
baseline=json.loads((backend/'deployment/phase7b-baseline.json').read_text())
changes=[]
for folder in ['app','bootstrap','bin']:
 for p in (backend/folder).rglob('*.php'):
  relative=p.relative_to(backend).as_posix()
  if hashlib.sha256(p.read_bytes()).hexdigest()!=baseline.get(relative):
   changes.append((relative,p,'REPLACE' if relative in baseline else 'CREATE'))
archive=backend/'deployment/phase7b-catalogue-incremental.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for relative,p,_ in changes:z.write(p,'private/virasat-backend/'+relative)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert all(name.startswith('private/virasat-backend/') and '/config/' not in name and '/database/' not in name and '/storage/' not in name for name in z.namelist())
hashes={relative:hashlib.sha256(p.read_bytes()).hexdigest() for relative,p,_ in changes}
(backend/'deployment/phase7b-sha256.json').write_text(json.dumps(hashes,indent=2))
rows=['| Local source | Hostinger destination | Action | Location | SQL import | Back up |','| --- | --- | --- | --- | --- | --- |']
for relative,p,action in changes:
 rows.append('| '+p.as_posix()+' | domains/virasatorganics.com/private/virasat-backend/'+relative+' | '+action+' | Private | No | '+('Yes' if action=='REPLACE' else 'No existing file')+' |')
template=(root/'PHASE7B_UPLOAD_MAP.md').read_text()
start='<!-- FILE_MAP_START -->';end='<!-- FILE_MAP_END -->'
before=template.split(start)[0];after=template.split(end)[1]
(root/'PHASE7B_UPLOAD_MAP.md').write_text(before+start+'\n'+'\n'.join(rows)+'\n'+end+after)
print(str(archive));print(str(len(changes))+' PHP files; no config, SQL, user media or frontend files.')
