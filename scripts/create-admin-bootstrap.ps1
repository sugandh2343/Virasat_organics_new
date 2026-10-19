# Windows PowerShell 5.1+ / PowerShell 7 on Windows. No bootstrap runs in -CheckOnly mode.
[CmdletBinding()]
param([string]$Php, [switch]$CheckOnly)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$generator=Join-Path $project 'backend\bin\bootstrap-admin.php'
$utf8=New-Object System.Text.UTF8Encoding($false,$true)
$privateDirectory=$null
$destination=$null
$process=$null
$file=$null
$password=$null
$confirmation=$null
$plain=$null
$confirmPlain=$null
$payload=$null
$inputBytes=$null
$pointer=[IntPtr]::Zero
$confirmPointer=[IntPtr]::Zero
$failureCategory='PHP_CLI_FAILED'
$success=$false
$phpPath=$null
function Remove-PrivateOutput {
 if($destination -and (Test-Path -LiteralPath $destination)){Remove-Item -LiteralPath $destination -Force}
 # Only remove our unique directory if empty. Never recursive deletion.
 if($privateDirectory -and (Test-Path -LiteralPath $privateDirectory)){
  if(@(Get-ChildItem -LiteralPath $privateDirectory -Force).Count -eq 0){Remove-Item -LiteralPath $privateDirectory}
 }
}
try {
 if($env:OS -ne 'Windows_NT'){throw 'Windows is required.'}
 if(!(Test-Path -LiteralPath $generator -PathType Leaf)){throw 'Expected bootstrap-admin.php is missing. Do not substitute an unreviewed generator.'}
 $candidates=@()
 if($Php){$candidates+= $Php}
 else {
  $commands=@(Get-Command php.exe -CommandType Application -All -ErrorAction SilentlyContinue)
  $candidates+=@($commands | ForEach-Object {$_.Source})
  $candidates+=@('C:\xampp\php\php.exe','C:\php\php.exe','C:\tools\php\php.exe','C:\Program Files\PHP\php.exe')
  if($env:USERPROFILE){$candidates+=(Join-Path $env:USERPROFILE 'scoop\apps\php\current\php.exe')}
 }
 $phpPath=$null
 foreach($candidate in $candidates){
  if($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)){
   $resolved=(Resolve-Path -LiteralPath $candidate).Path
   $phpPath=$resolved;break
  }
 }
 if(!$phpPath){throw 'PHP CLI unavailable. Supply -Php with an existing PHP 8+ php.exe; the XAMPP CLI binary is supported without services.'}
 $probe=New-Object Diagnostics.Process
 $probe.StartInfo=New-Object Diagnostics.ProcessStartInfo
 $probe.StartInfo.FileName=$phpPath
 $probe.StartInfo.Arguments='-n -r "exit(PHP_SAPI === ''cli'' && PHP_VERSION_ID >= 80000 ? 0 : 1);"'
 $probe.StartInfo.UseShellExecute=$false
 $probe.StartInfo.CreateNoWindow=$true
 $probe.StartInfo.RedirectStandardOutput=$true
 $probe.StartInfo.RedirectStandardError=$true
 try {
  if(!$probe.Start()){throw 'PHP probe failed.'}
  $probeOut=$probe.StandardOutput.ReadToEndAsync()
  $probeErr=$probe.StandardError.ReadToEndAsync()
  if(!$probe.WaitForExit(10000)){$probe.Kill();$probe.WaitForExit();throw 'PHP probe timed out.'}
  $null=$probeOut.GetAwaiter().GetResult()
  $null=$probeErr.GetAwaiter().GetResult()
  if($probe.ExitCode -ne 0){throw 'PHP 8+ CLI required.'}
 } finally {$probe.Dispose()}
 if($CheckOnly){Write-Output "Prerequisite check passed. PHP CLI: $phpPath. Bootstrap was NOT run.";return}
 Write-Host 'Before proceeding, in the selected V2 phpMyAdmin database run:'
 Write-Host 'SELECT COUNT(*) AS admin_count FROM admin_users;'
 Write-Host 'Require admin_count = 0 and /api/ready = ready. Do not proceed after any SQL error.'
 $failureCategory='INVALID_CONFIRMATION'
 $verified=Read-Host 'Type VERIFIED EMPTY only after those live checks'
 if($verified -cne 'VERIFIED EMPTY'){throw 'Live database checks have not been confirmed.'}
 $failureCategory='INVALID_NAME'
 $name=(Read-Host 'Administrator name').Trim()
 $email=(Read-Host 'Administrator email').Trim()
 if(!$name -or $utf8.GetByteCount($name) -gt 200 -or $name -match '[\x00-\x1f]'){throw 'Name is required and must be at most 200 UTF-8 bytes.'}
 $failureCategory='INVALID_EMAIL'
 if($email.Length -gt 254 -or $email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$'){throw 'Enter a valid email of at most 254 characters.'}
 $failureCategory='SECURE_INPUT_FAILED'
 $password=Read-Host 'Unique password (16-72 UTF-8 bytes; preferably password-manager generated)' -AsSecureString
 $confirmation=Read-Host 'Confirm password' -AsSecureString
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
 $confirmPointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmation)
 $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 $confirmPlain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)
 $bytes=$utf8.GetByteCount($plain)
 if($bytes -lt 16){$failureCategory='PASSWORD_TOO_SHORT';throw 'Validation failed.'}
 if($bytes -gt 72){$failureCategory='PASSWORD_TOO_LONG';throw 'Validation failed.'}
 if($plain.Length -lt 12 -or $plain -match '[\x00-\x1f]' -or @($plain.ToCharArray() | Select-Object -Unique).Count -lt 8){
  $failureCategory='PASSWORD_POLICY_FAILED';throw 'Validation failed.'
 }
 if(![String]::Equals($plain,$confirmPlain,[StringComparison]::Ordinal)){$failureCategory='PASSWORD_MISMATCH';throw 'Validation failed.'}
 $failureCategory='OUTPUT_FILE_FAILED'

 $failureCategory='OUTPUT_LOCATION_INSIDE_GIT'
 $outputBases=@($env:LOCALAPPDATA,[Environment]::GetFolderPath('CommonApplicationData'))
 foreach($base in $outputBases){
  if(!$base){continue}
  $candidate=[IO.Path]::GetFullPath((Join-Path $base ('VirasatOrganics\bootstrap\'+[Guid]::NewGuid().ToString('N'))))
  if($candidate.StartsWith($project.TrimEnd('\')+'\', [StringComparison]::OrdinalIgnoreCase)){continue}
  $ancestor=[IO.DirectoryInfo]$candidate
  $insideGit=$false
  while($ancestor){
   if(Test-Path -LiteralPath (Join-Path $ancestor.FullName '.git')){$insideGit=$true;break}
   $ancestor=$ancestor.Parent
  }
  if(!$insideGit){$privateDirectory=$candidate;break}
 }
 if(!$privateDirectory){throw 'No private location outside Git found.'}
 $failureCategory='OUTPUT_FILE_FAILED'
 $null=[IO.Directory]::CreateDirectory($privateDirectory)
 $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
 $acl=New-Object Security.AccessControl.DirectorySecurity
 $acl.SetOwner($sid)
 $acl.SetAccessRuleProtection($true,$false)
 $rule=New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
 $acl.AddAccessRule($rule)
 Set-Acl -LiteralPath $privateDirectory -AclObject $acl
 $actualAcl=Get-Acl -LiteralPath $privateDirectory
 if(!$actualAcl.AreAccessRulesProtected){throw 'Private directory permissions could not be restricted.'}
 $destination=Join-Path $privateDirectory 'admin-bootstrap.sql'
 $failureCategory='JSON_ENCODING_FAILED'
 $payload=@{name=$name;email=$email;password=$plain}|ConvertTo-Json -Compress
 $process=New-Object Diagnostics.Process
 $process.StartInfo=New-Object Diagnostics.ProcessStartInfo
 $process.StartInfo.FileName=$phpPath
 $process.StartInfo.Arguments='-n -d display_errors=0 -d log_errors=0 "'+$generator+'"'
 $process.StartInfo.UseShellExecute=$false
 $process.StartInfo.CreateNoWindow=$true
 $process.StartInfo.RedirectStandardInput=$true
 $process.StartInfo.RedirectStandardOutput=$true
 $process.StartInfo.RedirectStandardError=$true
  # Windows PowerShell 5.1 lacks ProcessStartInfo.StandardInputEncoding.
 # Send explicit UTF-8 bytes without BOM through the redirected stdin stream.
 $failureCategory='OUTPUT_FILE_FAILED'
 $file=New-Object IO.FileStream($destination,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 $failureCategory='PHP_CLI_FAILED'
 if(!$process.Start()){throw 'PHP could not start.'}
 # SQL goes directly to an ACL-restricted file, never the terminal or a PS pipeline.
 $outputTask=$process.StandardOutput.BaseStream.CopyToAsync($file)
 $errorTask=$process.StandardError.ReadToEndAsync()
 $failureCategory='STDIN_ENCODING_FAILED'
 $inputBytes=$utf8.GetBytes($payload)
 $process.StandardInput.BaseStream.Write($inputBytes,0,$inputBytes.Length)
 $process.StandardInput.BaseStream.Flush()
 [Array]::Clear($inputBytes,0,$inputBytes.Length)
 $inputBytes=$null
 $process.StandardInput.Close()
 $failureCategory='SQL_GENERATOR_FAILED'
 if(!$process.WaitForExit(30000)){$process.Kill();$process.WaitForExit();throw 'SQL generation timed out.'}
 $null=$outputTask.GetAwaiter().GetResult()
 $privateError=$errorTask.GetAwaiter().GetResult()
 $file.Dispose();$file=$null
 if($process.ExitCode -ne 0 -or $privateError.Length -gt 0 -or (Get-Item -LiteralPath $destination).Length -eq 0){
  throw 'SQL generation failed. Output has been discarded; no diagnostic contents will be printed.'
 }
 $privateError=$null
 $success=$true
 Write-Output "Private SQL file: $destination"
 Write-Output 'Generated only; nothing was imported or uploaded. Import through phpMyAdmin, verify success, then delete this file.'
} catch {
 # Never echo exception details, invocation arguments, JSON, stderr or SQL.
 Write-Warning ("Bootstrap stopped: "+$failureCategory+". No credentials, SQL or raw diagnostics are displayed. Helper line: "+$_.InvocationInfo.ScriptLineNumber+"; exception type: "+$_.Exception.GetType().Name)
} finally {
 if($process){
  try{if(!$process.HasExited){$process.Kill();$process.WaitForExit()}}catch{}
  $process.Dispose()
 }
 if($file){$file.Dispose()}
 if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
 if($confirmPointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer)}
 if($password){$password.Dispose()}
 if($confirmation){$confirmation.Dispose()}
 if($inputBytes){[Array]::Clear($inputBytes,0,$inputBytes.Length)}
 $inputBytes=$null
 $plain=$null;$confirmPlain=$null;$payload=$null;$privateError=$null
 if(!$success -and !$CheckOnly){try{Remove-PrivateOutput}catch{Write-Warning 'Cleanup could not finish. Inspect the private output directory without displaying its contents.'}}
}
if(!$success){exit 1}

