from pathlib import Path
import json,hashlib,re
root=Path('backend/database');(root/'migrations').mkdir(parents=True,exist_ok=True);(root/'manual').mkdir(exist_ok=True);(root/'seeds').mkdir(exist_ok=True)
tables={};relations=[]
ID="VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin"
def t(name,cols,extra=[],mutable=True,pk=True):
    c={}
    if pk:c['id']=ID+' NOT NULL PRIMARY KEY'
    c.update(cols)
    if mutable:
        c.update(created_at='DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',updated_at='DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',version='BIGINT UNSIGNED NOT NULL DEFAULT 1')
    tables[name]={'columns':c,'extra':list(extra),'foreign':[]}
def ref(table,col,target,nullable=False):
    tables[table]['columns'][col]=ID+(' NULL' if nullable else ' NOT NULL')
    name='fk_'+table+'_'+col
    relations.append((table,col,target,'id',name));tables[table]['foreign'].append({'column':col,'target':target,'targetColumn':'id','name':name})
    tables[table]['extra'].append('KEY ix_'+col+' ('+col+')')
def status(values,default=None):
    return 'VARCHAR(32) NOT NULL'+(" DEFAULT '"+default+"'" if default else '')
def check(name,expr):return 'CONSTRAINT ck_'+name+' CHECK ('+expr+')'
def en(name,col,values):return check(name,col+" IN ("+','.join("'"+x+"'" for x in values.split())+")")
money='BIGINT UNSIGNED';txt='VARCHAR(200)';dt='DATETIME(6)'
t('schema_migrations',{'version':'VARCHAR(100) NOT NULL PRIMARY KEY','checksum':'CHAR(64) NOT NULL','applied_at':dt+' NOT NULL','execution_ms':'BIGINT UNSIGNED NOT NULL'},mutable=False,pk=False)
t('admin_users',{'email':'VARCHAR(254) NOT NULL','name':txt+' NOT NULL','password_hash':'VARCHAR(255) NOT NULL','status':status(''),'last_login_at':dt+' NULL','password_changed_at':dt+' NULL'},['UNIQUE KEY uq_email (email)',en('admin_status','status','active disabled')])
t('admin_roles',{'role_key':'VARCHAR(64) NOT NULL','name':txt+' NOT NULL'},['UNIQUE KEY uq_role_key (role_key)'])
t('admin_permissions',{'permission_key':'VARCHAR(80) NOT NULL PRIMARY KEY'},mutable=False,pk=False)
t('admin_user_roles',{},['PRIMARY KEY (admin_user_id,role_id)'],mutable=False,pk=False);ref('admin_user_roles','admin_user_id','admin_users');ref('admin_user_roles','role_id','admin_roles')
t('admin_role_permissions',{'role_id':ID+' NOT NULL','permission_key':'VARCHAR(80) NOT NULL'},['PRIMARY KEY (role_id,permission_key)','KEY ix_permission (permission_key)'],mutable=False,pk=False)
ref('admin_role_permissions','role_id','admin_roles');relations.append(('admin_role_permissions','permission_key','admin_permissions','permission_key','fk_role_permission'))
tables['admin_role_permissions']['foreign'].append({'column':'permission_key','target':'admin_permissions','targetColumn':'permission_key','name':'fk_role_permission'})
t('media_assets',{'storage_key':'VARCHAR(255) NOT NULL','original_name':txt+' NOT NULL','mime_type':'VARCHAR(100) NOT NULL','bytes':money+' NOT NULL','kind':status(''),'width':'INT UNSIGNED NULL','height':'INT UNSIGNED NULL','duration_ms':'INT UNSIGNED NULL','alt':'TEXT NULL','caption':'TEXT NULL','status':status(''),'checksum_sha256':'CHAR(64) NOT NULL'},['UNIQUE KEY uq_storage_key (storage_key)','KEY ix_status_created (status,created_at,id)','KEY ix_checksum (checksum_sha256)',en('media_kind','kind','image video'),en('media_status','status','processing ready rejected archived')]);ref('media_assets','owner_admin_id','admin_users',True)
t('categories',{'slug':'VARCHAR(120) NOT NULL','name':txt+' NOT NULL','description':'TEXT NULL','status':status(''),'sort_order':'INT UNSIGNED NOT NULL DEFAULT 0'},['UNIQUE KEY uq_slug (slug)','KEY ix_status_order (status,sort_order,id)',en('category_status','status','active inactive')]);ref('categories','image_media_asset_id','media_assets',True)
t('products',{'slug':'VARCHAR(120) NOT NULL','sku':'VARCHAR(120) NOT NULL','name':txt+' NOT NULL','size':'VARCHAR(40) NOT NULL','status':status(''),'price_paise':money+' NULL','compare_at_price_paise':money+' NULL','short_description':'TEXT NULL','long_description':'TEXT NULL','ingredients':'JSON NOT NULL','nutrition':'JSON NULL','storage':'TEXT NULL','specifications':'JSON NOT NULL','seo_title':txt+' NULL','seo_description':'TEXT NULL','is_core_seed':'BOOLEAN NOT NULL DEFAULT 0','display_order':'INT UNSIGNED NOT NULL DEFAULT 0','keywords':'JSON NOT NULL'},['UNIQUE KEY uq_slug (slug)','UNIQUE KEY uq_sku (sku)','KEY ix_category_status (category_id,status,id)','KEY ix_status_name (status,name,id)','KEY ix_status_order (status,display_order,id)',en('product_status','status','active inactive out_of_stock coming_soon'),check('compare_price','compare_at_price_paise IS NULL OR price_paise IS NULL OR compare_at_price_paise >= price_paise')]);ref('products','category_id','categories')
t('inventory_balances',{'product_id':ID+' NOT NULL PRIMARY KEY','on_hand':'INT UNSIGNED NULL','reserved':'INT UNSIGNED NOT NULL DEFAULT 0','version':'BIGINT UNSIGNED NOT NULL DEFAULT 1','updated_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},[check('balance','(on_hand IS NULL AND reserved=0) OR (on_hand IS NOT NULL AND reserved<=on_hand)')],mutable=False,pk=False)
relations.append(('inventory_balances','product_id','products','id','fk_balance_product'));tables['inventory_balances']['foreign'].append({'column':'product_id','target':'products','targetColumn':'id','name':'fk_balance_product'})
for name in ['product_images','product_videos']:
    cols={'sort_order':'INT UNSIGNED NOT NULL','alt':'TEXT NULL'} if name=='product_images' else {'sort_order':'INT UNSIGNED NOT NULL','caption':'TEXT NULL'}
    t(name,cols,['UNIQUE KEY uq_product_media (product_id,media_asset_id)','UNIQUE KEY uq_product_order (product_id,sort_order)'])
    ref(name,'product_id','products');ref(name,'media_asset_id','media_assets')
    if name=='product_videos':ref(name,'poster_media_asset_id','media_assets',True)
t('customers',{'firebase_uid':'VARCHAR(128) NOT NULL','name':'VARCHAR(80) NULL','phone_e164':'VARCHAR(16) NULL','phone_verified_at':dt+' NULL','email':'VARCHAR(254) NULL','status':status('')},['UNIQUE KEY uq_firebase (firebase_uid)','UNIQUE KEY uq_phone (phone_e164)','KEY ix_status_created (status,created_at,id)',en('customer_status','status','active disabled')]);ref('customers','default_address_id','addresses',True)
t('addresses',{'label':'VARCHAR(20) NOT NULL','recipient':txt+' NOT NULL','phone_e164':'VARCHAR(16) NOT NULL','building':txt+' NOT NULL','street':txt+' NOT NULL','locality':txt+' NOT NULL','city':txt+' NOT NULL','state':txt+' NOT NULL','postal_code':'CHAR(6) NOT NULL','country_code':"CHAR(2) NOT NULL DEFAULT 'IN'",'landmark':'TEXT NULL','instructions':'VARCHAR(200) NULL','latitude':'DECIMAL(10,7) NULL','longitude':'DECIMAL(10,7) NULL','coordinates_confirmed':'BOOLEAN NOT NULL DEFAULT 0','deleted_at':dt+' NULL'},['KEY ix_owner_active (customer_id,deleted_at,id)',en('address_label','label','Home Work Other'),check('address_country',"country_code='IN'"),check('latitude','latitude IS NULL OR latitude BETWEEN -90 AND 90'),check('longitude','longitude IS NULL OR longitude BETWEEN -180 AND 180'),check('confirmed_coords','coordinates_confirmed=0 OR (latitude IS NOT NULL AND longitude IS NOT NULL)')]);ref('addresses','customer_id','customers')
t('php_sessions',{'id_hash':'CHAR(64) NOT NULL PRIMARY KEY','payload_encrypted':'BLOB NOT NULL','csrf_hash':'CHAR(64) NOT NULL','authenticated_at':dt+' NULL','last_seen_at':dt+' NOT NULL','expires_at':dt+' NOT NULL','revoked_at':dt+' NULL'},['KEY ix_expiry (expires_at)',check('session_owner','customer_id IS NULL OR admin_user_id IS NULL')],mutable=False,pk=False);ref('php_sessions','customer_id','customers',True);ref('php_sessions','admin_user_id','admin_users',True)
t('wishlist_items',{'created_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},['PRIMARY KEY (customer_id,product_id)'],mutable=False,pk=False);ref('wishlist_items','customer_id','customers');ref('wishlist_items','product_id','products')
t('delivery_settings',{'configured':'BOOLEAN NOT NULL DEFAULT 0','default_shipping_paise':money+' NULL','minimum_order_paise':money+' NULL','free_shipping_threshold_paise':money+' NULL','cod_enabled':'BOOLEAN NOT NULL DEFAULT 0','origin_address':'JSON NULL','tax_policy_version':'VARCHAR(100) NULL'},[check('delivery_singleton',"id='delivery-settings'")])
t('delivery_zones',{'name':txt+' NOT NULL','status':status(''),'shipping_paise':money+' NULL','minimum_order_paise':money+' NULL','free_shipping_threshold_paise':money+' NULL','cod_enabled':'BOOLEAN NOT NULL DEFAULT 0','priority':'INT NOT NULL DEFAULT 0'},['KEY ix_zone_status (status,priority)',en('zone_status','status','active inactive')])
t('delivery_zone_pins',{'postal_code':'CHAR(6) NOT NULL PRIMARY KEY'},mutable=False,pk=False);ref('delivery_zone_pins','zone_id','delivery_zones')
totals={x+'_paise':money+' NOT NULL' for x in ['subtotal','shipping','tax','total']}
t('checkout_quotes',{'address_version':'BIGINT UNSIGNED NOT NULL','settings_version':'BIGINT UNSIGNED NOT NULL','currency':"CHAR(3) NOT NULL DEFAULT 'INR'",**totals,'payment_methods':'JSON NOT NULL','expires_at':dt+' NOT NULL'},['KEY ix_owner_expiry (customer_id,expires_at)','UNIQUE KEY uq_consumed (consumed_order_id)',check('quote_total','total_paise=subtotal_paise+shipping_paise+tax_paise')]);ref('checkout_quotes','customer_id','customers');ref('checkout_quotes','address_id','addresses');ref('checkout_quotes','delivery_zone_id','delivery_zones');ref('checkout_quotes','consumed_order_id','orders',True)
line={'quantity':'INT UNSIGNED NOT NULL','unit_price_paise':money+' NOT NULL','line_subtotal_paise':money+' NOT NULL','tax_paise':money+' NOT NULL'}
t('quote_items',{'product_version':'BIGINT UNSIGNED NOT NULL',**line},['UNIQUE KEY uq_quote_product (quote_id,product_id)',check('quote_quantity','quantity>0'),check('quote_line','line_subtotal_paise=quantity*unit_price_paise')]);ref('quote_items','quote_id','checkout_quotes');ref('quote_items','product_id','products')
fulfil='placed confirmed packed shipped out_for_delivery delivered cancelled'
t('orders',{'public_reference':'VARCHAR(64) NOT NULL','status':status(''),'payment_method':status(''),'payment_status':status(''),'currency':"CHAR(3) NOT NULL DEFAULT 'INR'",**totals,'delivery_address_snapshot':'JSON NOT NULL','customer_snapshot':'JSON NOT NULL','delivery_instructions':'VARCHAR(200) NULL','idempotency_key':'VARCHAR(128) NOT NULL','placed_at':dt+' NOT NULL'},['UNIQUE KEY uq_reference (public_reference)','UNIQUE KEY uq_quote (quote_id)','UNIQUE KEY uq_owner_request (customer_id,idempotency_key)','KEY ix_owner_created (customer_id,created_at,id)','KEY ix_status_created (status,created_at,id)',check('order_total','total_paise=subtotal_paise+shipping_paise+tax_paise'),en('order_status','status',fulfil),en('order_method','payment_method','cod razorpay'),en('order_payment_status','payment_status','pending authorized paid failed refund_pending refunded')]);ref('orders','customer_id','customers');ref('orders','quote_id','checkout_quotes')
t('order_items',{'sku_snapshot':'VARCHAR(120) NOT NULL','name_snapshot':txt+' NOT NULL','size_snapshot':'VARCHAR(40) NOT NULL','media_snapshot':'JSON NULL',**line},['UNIQUE KEY uq_order_product (order_id,product_id)',check('order_quantity','quantity>0'),check('order_line','line_subtotal_paise=quantity*unit_price_paise')]);ref('order_items','order_id','orders');ref('order_items','product_id','products')
t('order_status_events',{'from_status':'VARCHAR(32) NULL','to_status':'VARCHAR(32) NOT NULL','occurred_at':dt+' NOT NULL','public_note':'TEXT NULL','created_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},['KEY ix_order_time (order_id,occurred_at,id)',en('event_to','to_status',fulfil),check('event_actor','actor_admin_id IS NULL OR actor_customer_id IS NULL')],mutable=False);ref('order_status_events','order_id','orders');ref('order_status_events','actor_admin_id','admin_users',True);ref('order_status_events','actor_customer_id','customers',True)
t('order_notes',{'note':'TEXT NOT NULL','created_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},['KEY ix_order_created (order_id,created_at)'],mutable=False);ref('order_notes','order_id','orders');ref('order_notes','admin_user_id','admin_users')
t('inventory_reservations',{'quantity':'INT UNSIGNED NOT NULL','status':status(''),'expires_at':dt+' NULL','consumed_at':dt+' NULL','released_at':dt+' NULL'},['UNIQUE KEY uq_order_product (order_id,product_id)','KEY ix_status_expiry (status,expires_at)',en('reservation_status','status','held consumed released'),check('reservation_quantity','quantity>0'),check('reservation_terminal','consumed_at IS NULL OR released_at IS NULL')]);ref('inventory_reservations','order_id','orders');ref('inventory_reservations','product_id','products')
t('inventory_movements',{'kind':status(''),'on_hand_delta':'INT NOT NULL','reserved_delta':'INT NOT NULL','reason':'TEXT NOT NULL','idempotency_key':'VARCHAR(128) NOT NULL','resulting_on_hand':'INT UNSIGNED NOT NULL','resulting_reserved':'INT UNSIGNED NOT NULL','created_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},['KEY ix_product_created (product_id,created_at,id)','UNIQUE KEY uq_movement (idempotency_key,product_id,kind)',en('movement_kind','kind','initialize adjust reserve release deduct restock'),check('movement_balance','resulting_reserved<=resulting_on_hand')],mutable=False);ref('inventory_movements','product_id','products');ref('inventory_movements','actor_admin_id','admin_users',True);ref('inventory_movements','order_id','orders',True);ref('inventory_movements','reservation_id','inventory_reservations',True)
t('payments',{'provider':status(''),'provider_order_id':'VARCHAR(128) NULL','provider_payment_id':'VARCHAR(128) NULL','amount_paise':money+' NOT NULL','currency':"CHAR(3) NOT NULL DEFAULT 'INR'",'status':status(''),'captured_at':dt+' NULL'},['UNIQUE KEY uq_provider_order (provider,provider_order_id)','UNIQUE KEY uq_provider_payment (provider,provider_payment_id)','KEY ix_order_status (order_id,status)',en('payment_provider','provider','cod razorpay'),en('payment_state','status','created authorized captured failed refund_pending refunded')]);ref('payments','order_id','orders')
t('payment_events',{'provider':'VARCHAR(32) NOT NULL','event_id':'VARCHAR(255) NOT NULL','body_hash':'CHAR(64) NOT NULL','payload_encrypted':'BLOB NOT NULL','signature_verified_at':dt+' NOT NULL','received_at':dt+' NOT NULL','processed_at':dt+' NULL','status':status(''),'attempts':'INT UNSIGNED NOT NULL DEFAULT 0','last_error_code':'VARCHAR(80) NULL'},['UNIQUE KEY uq_provider_event (provider,event_id)','KEY ix_status_received (status,received_at)',en('payment_event_status','status','pending processed failed')],mutable=False);ref('payment_events','payment_id','payments',True)
t('homepage_sections',{'section_key':'VARCHAR(40) NOT NULL','enabled':'BOOLEAN NOT NULL DEFAULT 0','sort_order':'INT UNSIGNED NOT NULL','content':'JSON NOT NULL'},['UNIQUE KEY uq_section (section_key)','UNIQUE KEY uq_sort (sort_order)',en('section_key','section_key','hero categories collection introduction gallery story values journal testimonials newsletter')])
t('banners',{'title':txt+' NOT NULL','alt':'TEXT NULL','cta_label':txt+' NULL','cta_destination':'VARCHAR(2048) NULL','status':status(''),'sort_order':'INT UNSIGNED NOT NULL DEFAULT 0'},['KEY ix_status_sort (status,sort_order,id)',en('banner_status','status','active inactive archived')]);ref('banners','desktop_media_asset_id','media_assets',True);ref('banners','mobile_media_asset_id','media_assets',True)
t('blog_categories',{'slug':'VARCHAR(120) NOT NULL','name':txt+' NOT NULL','status':status('')},['UNIQUE KEY uq_slug (slug)',en('blog_category_status','status','active inactive')])
document={'slug':'VARCHAR(120) NOT NULL','title':txt+' NOT NULL','blocks':'JSON NOT NULL','status':status(''),'seo_title':txt+' NULL','seo_description':'TEXT NULL','published_at':dt+' NULL','is_core_seed':'BOOLEAN NOT NULL DEFAULT 0'}
t('blog_posts',{**document,'excerpt':'TEXT NULL','preview_enabled':'BOOLEAN NOT NULL DEFAULT 0'},['UNIQUE KEY uq_slug (slug)','KEY ix_status_published (status,published_at,id)',en('blog_status','status','draft published archived'),check('blog_published',"status<>'published' OR (published_at IS NOT NULL AND JSON_LENGTH(blocks)>0)")]);ref('blog_posts','blog_category_id','blog_categories',True);ref('blog_posts','image_media_asset_id','media_assets',True);ref('blog_posts','author_admin_id','admin_users',True)
t('cms_pages',{**document,'description':'TEXT NULL'},['UNIQUE KEY uq_slug (slug)',en('cms_status','status','draft published archived'),check('cms_published',"status<>'published' OR (published_at IS NOT NULL AND JSON_LENGTH(blocks)>0)")]);ref('cms_pages','video_media_asset_id','media_assets',True);ref('cms_pages','poster_media_asset_id','media_assets',True)
t('media_references',{'field_path':'VARCHAR(255) NOT NULL'},[check('media_owner','(homepage_section_id IS NOT NULL)+(blog_post_id IS NOT NULL)+(cms_page_id IS NOT NULL)=1')])
ref('media_references','media_asset_id','media_assets')
for col,target in [('homepage_section_id','homepage_sections'),('blog_post_id','blog_posts'),('cms_page_id','cms_pages')]:ref('media_references',col,target,True)
t('business_settings',{'name':txt+' NOT NULL','hindi_name':txt+' NULL','tagline':txt+' NULL','logo_alt':txt+' NULL','introduction':'TEXT NULL','email':'VARCHAR(254) NULL','phone_e164':'VARCHAR(16) NULL','whatsapp_e164':'VARCHAR(16) NULL','address':'TEXT NULL','operating_hours':'TEXT NULL','contacts_visible':'BOOLEAN NOT NULL DEFAULT 0','announcement_enabled':'BOOLEAN NOT NULL DEFAULT 0','preview_notice':'TEXT NULL','footer_description_visible':'BOOLEAN NOT NULL DEFAULT 0','footer_note':'TEXT NULL','maintenance_enabled':'BOOLEAN NOT NULL DEFAULT 0','accept_orders':'BOOLEAN NOT NULL DEFAULT 0','currency':"CHAR(3) NOT NULL DEFAULT 'INR'",'seo_title':txt+' NULL','seo_description':'TEXT NULL','seo_site_url':'VARCHAR(2048) NULL'},[check('business_singleton',"id='business-virasat'")]);ref('business_settings','logo_media_asset_id','media_assets',True);ref('business_settings','seo_image_media_asset_id','media_assets',True)
t('business_social_links',{'label':'VARCHAR(80) NOT NULL','url':'VARCHAR(2048) NOT NULL','sort_order':'INT UNSIGNED NOT NULL'},['UNIQUE KEY uq_business_label (business_id,label)']);ref('business_social_links','business_id','business_settings')
t('compliance_settings',{'gstin_value':'VARCHAR(15) NULL','gstin_visible':'BOOLEAN NOT NULL DEFAULT 0','fssai_value':'VARCHAR(14) NULL','fssai_visible':'BOOLEAN NOT NULL DEFAULT 0','notes':'TEXT NULL'},[check('compliance_singleton',"id='compliance-settings'")])
t('audit_logs',{'action':'VARCHAR(100) NOT NULL','resource_type':'VARCHAR(60) NOT NULL','resource_id':ID+' NOT NULL','request_id':'VARCHAR(64) NOT NULL','occurred_at':dt+' NOT NULL','redacted_before':'JSON NULL','redacted_after':'JSON NULL','source':'VARCHAR(40) NOT NULL'},['KEY ix_resource_time (resource_type,resource_id,occurred_at)','KEY ix_actor_time (actor_admin_id,occurred_at)',check('audit_actor','actor_admin_id IS NULL OR actor_customer_id IS NULL')],mutable=False);ref('audit_logs','actor_admin_id','admin_users',True);ref('audit_logs','actor_customer_id','customers',True)
t('idempotency_keys',{'actor_scope':'VARCHAR(100) NOT NULL','method':'VARCHAR(10) NOT NULL','path_hash':'CHAR(64) NOT NULL','key_value':'VARCHAR(128) NOT NULL','request_hash':'CHAR(64) NOT NULL','status':'VARCHAR(20) NOT NULL','result_status':'SMALLINT UNSIGNED NULL','result_json':'JSON NULL','expires_at':dt+' NOT NULL','created_at':dt+' NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'},['UNIQUE KEY uq_request (actor_scope,method,path_hash,key_value)','KEY ix_expiry (expires_at)',en('idempotency_status','status','pending complete')],mutable=False)
t('rate_limit_buckets',{'bucket_hash':'CHAR(64) NOT NULL','window_start':dt+' NOT NULL','request_count':'INT UNSIGNED NOT NULL','expires_at':dt+' NOT NULL'},['PRIMARY KEY (bucket_hash,window_start)','KEY ix_expiry (expires_at)'],mutable=False,pk=False)
# Extra universal constraints; no floats for financial values.
for name,table in tables.items():
 for col,typ in table['columns'].items():
  if col.endswith('_paise'):table['extra'].append(check(name+'_'+col,col+' IS NULL OR '+col+'<=9007199254740991'))
  if typ.startswith('BOOLEAN'):table['extra'].append(check(name+'_'+col,col+' IN (0,1)'))
  if col=='currency':table['extra'].append(check(name+'_currency',"currency='INR'"))
parts=[]
for name,table in tables.items():
 parts.append('CREATE TABLE IF NOT EXISTS '+name+' (\n '+',\n '.join([col+' '+definition for col,definition in table['columns'].items()]+table['extra'])+'\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;')
(root/'migrations/001_tables.sql').write_text('\n\n'.join(parts)+'\n',encoding='utf-8')
fk=[]
for table,col,target,targetcol,name in relations:
 statement='ALTER TABLE '+table+' ADD CONSTRAINT '+name+' FOREIGN KEY ('+col+') REFERENCES '+target+' ('+targetcol+') ON UPDATE RESTRICT ON DELETE RESTRICT'
 fk.append("SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='"+table+"' AND CONSTRAINT_NAME='"+name+"'), 'SELECT 1', '"+statement+"');\nPREPARE stmt FROM @ddl;\nEXECUTE stmt;\nDEALLOCATE PREPARE stmt;")
(root/'migrations/002_foreign_keys.sql').write_text('\n\n'.join(fk)+'\n',encoding='utf-8')
# Seed only actual specified identities; no prices, stock, company facts, users or orders.
seed=[]
def insert(table,cols,values,key,value):
 seed.append('INSERT INTO '+table+' ('+','.join(cols)+') SELECT '+','.join(values)+" WHERE NOT EXISTS (SELECT 1 FROM "+table+" WHERE "+key+"='"+value+"');")
for id,slug,name in [('category-atta','atta-flour','Atta & Flour'),('category-oils','mustard-oils','Mustard Oils')]:
 insert('categories',['id','slug','name','status'],["'"+v+"'"for v in [id,slug,name,'active']],'id',id)
products=[
('demo-atta-5kg','atta-5kg','DEMO-ATTA-5KG','Atta','5 kg','category-atta'),
('demo-black-oil-500ml','black-mustard-oil-500ml','DEMO-BMO-500ML','Black Mustard Oil','500 ml','category-oils'),
('demo-black-oil-1l','black-mustard-oil-1-litre','DEMO-BMO-1L','Black Mustard Oil','1 L','category-oils'),
('demo-yellow-oil-500ml','yellow-mustard-oil-500ml','DEMO-YMO-500ML','Yellow Mustard Oil','500 ml','category-oils'),
('demo-yellow-oil-1l','yellow-mustard-oil-1-litre','DEMO-YMO-1L','Yellow Mustard Oil','1 L','category-oils')]
for order,p in enumerate(products):
 insert('products',['id','slug','sku','name','size','category_id','status','price_paise','compare_at_price_paise','ingredients','specifications','keywords','is_core_seed','display_order'],["'"+v+"'"for v in p]+["'coming_soon'","NULL","NULL","JSON_ARRAY()","JSON_OBJECT()","JSON_ARRAY()","1",str(order)],'id',p[0])
 insert('inventory_balances',['product_id','on_hand','reserved'],["'"+p[0]+"'","NULL","0"],'product_id',p[0])
(root/'seeds/003_core_catalogue.sql').write_text('START TRANSACTION;\n'+'\n'.join(seed)+'\nCOMMIT;\n',encoding='utf-8')
manifest={'migrations':[],'tables':tables,'seedProductIds':[p[0]for p in products]}
for path in ['migrations/001_tables.sql','migrations/002_foreign_keys.sql','seeds/003_core_catalogue.sql']:
 data=(root/path).read_bytes();manifest['migrations'].append({'version':Path(path).stem,'file':path,'sha256':hashlib.sha256(data).hexdigest()})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
records=[]
for item in manifest['migrations']:
 records.append("INSERT INTO schema_migrations(version,checksum,applied_at,execution_ms) SELECT '"+item['version']+"','"+item['sha256']+"',UTC_TIMESTAMP(6),0 WHERE NOT EXISTS(SELECT 1 FROM schema_migrations WHERE version='"+item['version']+"');")
(root/'manual/record_verified_migrations.sql').write_text('-- ONLY after importing all SQL, zero errors, and passing verify_schema.sql. Never mark an unverified migration.\n'+'\n'.join(records)+'\n',encoding='utf-8')
verify=["SELECT VERSION() AS actual_version, DATABASE() AS selected_database;"]
for name,table in tables.items():
 for col in table['columns']:
  verify.append("SELECT '"+name+'.'+col+"' AS missing_column WHERE NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='"+name+"' AND COLUMN_NAME='"+col+"');")
for table,col,target,targetcol,name in relations:
 verify.append("SELECT '"+name+"' AS missing_or_wrong_fk WHERE NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='"+table+"' AND CONSTRAINT_NAME='"+name+"' AND COLUMN_NAME='"+col+"' AND REFERENCED_TABLE_NAME='"+target+"' AND REFERENCED_COLUMN_NAME='"+targetcol+"');")
verify.append("SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION;")
verify.append("SELECT id,slug,sku,status,price_paise,compare_at_price_paise,on_hand,reserved FROM products JOIN inventory_balances ON product_id=id ORDER BY display_order;")
(root/'manual/verify_schema.sql').write_text('\n'.join(verify)+'\n',encoding='utf-8')
print('Generated',len(tables),'tables,',len(relations),'foreign keys and 3 checksummed migrations.')

# phpMyAdmin finalization does not mark failures: collect structural issues before recording.
def lit(value):return "'"+str(value).replace("'","''")+"'"
diagnostics=["DROP TEMPORARY TABLE IF EXISTS virasat_migration_issues;","CREATE TEMPORARY TABLE virasat_migration_issues (issue VARCHAR(255) NOT NULL);"]
def issue(label,condition):
 diagnostics.append("INSERT INTO virasat_migration_issues SELECT "+lit(label)+" WHERE "+condition+";")
v="REPLACE(VERSION(),'5.5.5-','')"
major="CAST(SUBSTRING_INDEX("+v+",'.',1) AS UNSIGNED)"
minor="CAST(SUBSTRING_INDEX(SUBSTRING_INDEX("+v+",'.',2),'.',-1) AS UNSIGNED)"
issue('Unsupported database version',"IF(VERSION() LIKE '%MariaDB%', "+major+"<10 OR ("+major+"=10 AND "+minor+"<11), "+major+"<8 OR (SUBSTRING_INDEX("+v+",'.',2)='8.0' AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX("+v+",'.',3),'.',-1) AS UNSIGNED)<16))")
diagnostics.extend(["SET @check_enforcement_sql = IF(VERSION() LIKE '%MariaDB%', 'SELECT @@SESSION.check_constraint_checks INTO @checks_enabled', 'SET @checks_enabled=1');","PREPARE enforcement_stmt FROM @check_enforcement_sql;","EXECUTE enforcement_stmt;","DEALLOCATE PREPARE enforcement_stmt;"])
issue('CHECK enforcement disabled','@checks_enabled<>1')
for table,definition in tables.items():
 issue('Table engine/collation '+table,"NOT EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME="+lit(table)+" AND ENGINE='InnoDB' AND TABLE_COLLATION LIKE 'utf8mb4%')")
 for column,spec in definition['columns'].items():
  base=re.match(r'([A-Z]+)(?:\((\d+)(?:,(\d+))?\))?',spec)
  datatype=base[1].lower().replace('boolean','tinyint')
  nullable='NO' if 'NOT NULL' in spec or 'PRIMARY KEY' in spec else 'YES'
  conditions=["TABLE_SCHEMA=DATABASE()","TABLE_NAME="+lit(table),"COLUMN_NAME="+lit(column),("(DATA_TYPE='json' OR (VERSION() LIKE '%MariaDB%' AND DATA_TYPE='longtext'))" if datatype=='json' else "DATA_TYPE="+lit(datatype)),"IS_NULLABLE="+lit(nullable)]
  if datatype=='json':
   issue('JSON validity '+table+'.'+column,"VERSION() LIKE '%MariaDB%' AND NOT EXISTS(SELECT 1 FROM information_schema.CHECK_CONSTRAINTS cc JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA=cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME=cc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME="+lit(table)+" AND LOWER(REPLACE(REPLACE(cc.CHECK_CLAUSE,CHAR(96),''),' ','')) LIKE "+lit('%json_valid('+column+')%')+")")
  if datatype in ['varchar','char']:conditions.append('CHARACTER_MAXIMUM_LENGTH='+base[2])
  if datatype=='decimal':conditions.extend(['NUMERIC_PRECISION='+base[2],'NUMERIC_SCALE='+base[3]])
  if datatype=='datetime':conditions.append('DATETIME_PRECISION=6')
  if 'UNSIGNED' in spec:conditions.append("COLUMN_TYPE LIKE '%unsigned%'")
  issue('Column '+table+'.'+column,"NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE "+' AND '.join(conditions)+")")
  if 'PRIMARY KEY' in spec:
   issue('PK '+table+'.'+column,"NOT EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME="+lit(table)+" AND INDEX_NAME='PRIMARY' AND COLUMN_NAME="+lit(column)+")")
 for extra in definition['extra']:
  m=re.match(r'CONSTRAINT (\w+) CHECK',extra)
  if m:issue('Check '+m[1],"NOT EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME="+lit(table)+" AND CONSTRAINT_NAME="+lit(m[1])+" AND CONSTRAINT_TYPE='CHECK')")
  m=re.match(r'(UNIQUE KEY|KEY|PRIMARY KEY)\s*(?:(\w+)\s*)?\(([^)]+)\)',extra)
  if m:
   name='PRIMARY' if m[1]=='PRIMARY KEY' else m[2];cols=m[3].replace(' ','')
   issue('Index '+table+'.'+name,"NOT EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME="+lit(table)+" AND INDEX_NAME="+lit(name)+" GROUP BY INDEX_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',')="+lit(cols)+" AND MIN(NON_UNIQUE)="+('1' if m[1]=='KEY' else '0')+")")
for table,col,target,targetcol,name in relations:
 issue('FK '+name,"NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME="+lit(table)+" AND CONSTRAINT_NAME="+lit(name)+" AND COLUMN_NAME="+lit(col)+" AND REFERENCED_TABLE_NAME="+lit(target)+" AND REFERENCED_COLUMN_NAME="+lit(targetcol)+")")
for product in products:
 issue('Core product missing '+product[0],"NOT EXISTS(SELECT 1 FROM products p JOIN inventory_balances b ON b.product_id=p.id WHERE p.id="+lit(product[0])+")")
for item in manifest['migrations']:
 issue('Checksum conflict '+item['version'],"EXISTS(SELECT 1 FROM schema_migrations WHERE version="+lit(item['version'])+" AND checksum<>"+lit(item['sha256'])+")")
diagnostics.extend(["SET @enforced_sql = IF(VERSION() LIKE '%MariaDB%', 'SELECT 1', 'INSERT INTO virasat_migration_issues SELECT CONCAT(CHAR(67,72,69,67,75,32),CONSTRAINT_NAME) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND ENFORCED=CHAR(78,79)');","PREPARE enforced_stmt FROM @enforced_sql;","EXECUTE enforced_stmt;","DEALLOCATE PREPARE enforced_stmt;"])
footer=["SELECT * FROM virasat_migration_issues;","SELECT CASE WHEN COUNT(*)=0 THEN 'PASS - schema structure and core IDs verified' ELSE 'FAIL - do not mark migrations' END AS verification FROM virasat_migration_issues;"]
(root/'manual/verify_schema.sql').write_text('\n'.join(diagnostics+footer)+'\n',encoding='utf-8')
final=list(diagnostics)
for item in manifest['migrations']:
 final.append("INSERT INTO schema_migrations(version,checksum,applied_at,execution_ms) SELECT "+lit(item['version'])+","+lit(item['sha256'])+",UTC_TIMESTAMP(6),0 WHERE NOT EXISTS(SELECT 1 FROM virasat_migration_issues) AND NOT EXISTS(SELECT 1 FROM schema_migrations WHERE version="+lit(item['version'])+");")
final += footer+["SELECT version,checksum,applied_at FROM schema_migrations ORDER BY version;"]
(root/'manual/record_verified_migrations.sql').write_text('-- Import only after all three migrations completed without errors. Structural failures prevent recording.\n'+'\n'.join(final)+'\n',encoding='utf-8')
