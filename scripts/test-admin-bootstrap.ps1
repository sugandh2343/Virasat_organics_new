param([string]$Case='valid')
$ErrorActionPreference='Stop'
# Synthetic inputs only; do not use this test harness for a real administrator.
$global:answers=@('VERIFIED EMPTY','Synthetic CLI Test','synthetic@example.invalid')
$global:answerIndex=0
$global:passwordIndex=0
$global:synthetic='Test-'+[Guid]::NewGuid().ToString('N')
if($Case -eq 'short'){$global:synthetic='short'}
if($Case -eq 'long'){$global:synthetic=('A'*73)}
if($Case -eq 'policy'){$global:synthetic=('a'*20)}
if($Case -eq 'unicode'){$global:synthetic='Test-'+[char]0x00e9+[Guid]::NewGuid().ToString('N')}
if($Case -eq 'byte-long'){$global:synthetic=([string][char]0x00e9)*40}
if($Case -eq 'generator'){$global:answers[2]=([string][char]0x00e9)+'@example.invalid'}
if($Case -eq 'confirmation'){$global:answers[0]='WRONG'}
if($Case -eq 'email'){$global:answers[2]='not-an-email'}
function Read-Host {
 param([string]$Prompt,[switch]$AsSecureString)
 if($AsSecureString){
  $global:passwordIndex++
  $value=$global:synthetic
  if($Case -eq 'mismatch' -and $global:passwordIndex -eq 2){$value+='x'}
  return ConvertTo-SecureString -String $value -AsPlainText -Force
 }
 $result=$global:answers[$global:answerIndex];$global:answerIndex++;return $result
}

$output=@(& (Join-Path $PSScriptRoot 'create-admin-bootstrap.ps1') -Php 'C:\xampp\php\php.exe' 3>&1)
$location=@($output | Where-Object {$_ -is [string] -and $_.StartsWith('Private SQL file: ')})
if($location.Count -eq 0){
 $safe=@($output | Where-Object {$_ -is [Management.Automation.WarningRecord]})
 foreach($warning in $safe){Write-Output $warning.Message}
 exit 1
}
$filePath=$location[0].Substring('Private SQL file: '.Length)
$directory=Split-Path $filePath -Parent
try {
 if([IO.Path]::GetFileName($filePath) -ne 'admin-bootstrap.sql'){throw 'Unexpected synthetic output name'}
 $bytes=[IO.File]::ReadAllBytes($filePath)
 if($bytes.Length -lt 100 -or ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191)){throw 'Invalid SQL output or BOM'}
 $sql=[Text.Encoding]::UTF8.GetString($bytes)
 if(!$sql.StartsWith('-- Private one-time bootstrap:') -or !$sql.Contains('AS admin_created') -or $sql.Contains($global:synthetic)){throw 'SQL structure or plaintext leak check failed'}
 $acl=Get-Acl -LiteralPath $directory
 $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 if(!$acl.AreAccessRulesProtected){throw 'ACL inheritance not restricted'}
 foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
  if($rule.IdentityReference.Value -ne $sid){throw 'Unexpected ACL principal'}
 }
 Write-Output ('PASS: synthetic '+$Case+' SQL generation, no BOM/plaintext, owner-only ACL; output will be deleted.')
} finally {
 $sql=$null
 if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}
 Remove-Item -LiteralPath $filePath -Force
 # Exact unique directory only, never recursive.
 Remove-Item -LiteralPath $directory
 $global:synthetic=$null
}


