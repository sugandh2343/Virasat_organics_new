<?php
declare(strict_types=1);
foreach(['Helpers/Http','Services/Configuration','Repositories/Database','Middleware/Security','Services/UploadPolicy','Services/MigrationRunner','Controllers/SystemController']as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/CatalogueRules','Repositories/CatalogueRepository','Services/CatalogueAdmin','Services/AdminAuth','Services/CatalogueMedia','Controllers/CatalogueController']as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/FirebaseIdentity','Services/CustomerSecurity','Services/CustomerAccounts','Controllers/CustomerController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/CommerceRules','Services/DeliveryService','Services/CommerceService','Controllers/CommerceController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/RazorpayProvider','Services/RazorpayPayments','Controllers/PaymentController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/LaunchGate','Services/RuntimeSchema','Controllers/CrawlerController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/OperationsRules','Services/OperationsService','Services/OperationNotifications','Controllers/OperationsController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';

foreach(['Services/CMSRules','Services/CMSService','Controllers/CMSController'] as $module)require_once dirname(__DIR__).'/app/'.$module.'.php';
