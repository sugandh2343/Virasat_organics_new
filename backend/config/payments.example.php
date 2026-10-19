<?php
declare(strict_types=1);
// REFERENCE ONLY. Merge the payments entry inside the existing private config.php return array.
// Never replace config.php or put these values in Vite/public settings.
return ['payments'=>['razorpay'=>[
 'enabled'=>false,
 'key_id'=>'',
 'key_secret'=>'',
 'webhook_secret'=>'',
]]];
