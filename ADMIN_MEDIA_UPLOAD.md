# Admin local media upload update

## Implemented

Local file controls now accompany CMS image/video selectors: full homepage hero, individual hero product images, gallery, story, introductory video/poster, banners, blog/page image blocks, logo and SEO image. Product editor supports direct photo/video upload and preserves existing ordering/primary-image controls. Category images and video-poster metadata have inline uploads. Existing text editors remain editable; this release does not add editors for every hardcoded navigation/UI label.

A full hero image replaces the five-object illustration only when selected; clear the full image to restore the five-photo composition. Headline, emphasis, supporting text, CTA labels/destinations and showcase caption remain separately editable. Existing homepage drafts need no SQL initialization or migration for this optional slot.

Upload uses POST /api/admin/media with multipart files[], secure cookie session and CSRF. Existing server authorization accepts catalogue.write, content.write or settings.write; no public upload endpoint or permission bypass added. Existing GET/PATCH/DELETE media endpoints remain authoritative. Backend validates actual MIME/signatures, re-encodes images, generates private filenames and stores metadata; frontend checks are supplementary. JPEG/PNG/WebP <=10MB and <=16 megapixels on server; MP4 <=100MB. Host PHP upload/post limits can be lower.

Inline uploads avoid global data reload, preserving unsaved edits. New records are visible to other selectors during the current session, with preview and automatic selection. Product upload appends media; it does not replace existing photos. Failures leave the previous selection unchanged. Uploaded files already exist in the library even if the draft is discarded; remove unused media deliberately through the library. No automatic publication. Media requests have a bounded120-second client timeout; on ambiguous timeout inspect Media Library before retrying to avoid duplicates.

## Owner upload

Archive: D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-admin-media.zip
Inventory/checksums: deployment/admin-media-checksums.json.

Back up existing public_html/index.html and assets. Extract locally; upload assets to domains/virasatorganics.com/public_html/assets/ first, then replace public_html/index.html last. ZIP contains dist CONTENTS, no extra dist directory. Root .htaccess/robots and other static assets are unchanged from Phase7H; preserve any deliberate host-specific configuration. Never touch public_html/api/, private config.php, storage/media, sessions or database records. No PHP ZIP or SQL import is required. Retain old hashed assets during rollout. Hard-refresh Ctrl+Shift+R; purge cached index.html if necessary. Rollback restores the previous index/assets.

## How to use

1. Sign in at /admin/content and choose Hero.
2. Under Full hero image choose a local JPEG/PNG/WebP. Wait for Uploaded and selected. Add descriptive alt text and update the caption, removing placeholder wording if no longer accurate.
3. Review the draft and Publish homepage. Upload alone does not publish.
4. For Gallery, choose a file beside each image, then edit caption/alt text and publish.
5. Other CMS image/video fields work the same way. Product/category changes require Save; structured CMS pages/blogs retain their review/publication confirmation.
6. Use the existing Media Library for metadata, removal and reuse. No password, token or secret belongs in a content field.

## Hosting prerequisites / verification

Existing backend/app/Services/CatalogueMedia.php and AdminAuth::mediaGuard must match Phase7F/7G. PHP GD/fileinfo and writable private backend/storage/media are required. Owner may need to review Hostinger upload_max_filesize and post_max_size for intended files; do not change config.php credentials. Smaller actual upload limits should be respected. Permission errors require the existing explicit CMS role grant, not disabled guards.

Test a genuine small image locally in the browser: upload, verify preview, edit other text while uploading, save/publish, refresh and confirm image persists. Repeat gallery, logo/banner/blog/category/product and video poster. Check empty library, unsupported SVG, too-large file, expired session and permission rejection. No real hosted upload or publication was performed by this task; authenticated browser acceptance remains owner verification.

## Validation and changed files

All frontend check scripts run without failures (two opt-in live/browser checks skip). Focused inline-media test covers rendered file input, valid/invalid types and sizes, multipart+cookie+CSRF, no global reload on inline upload, explicit permission error and hero replacement rendering. Production build passed (1765 modules). PHP CMS63 and catalogue40 offline assertions passed. These are synthetic/local tests, not live upload acceptance.

New: src/components/admin/InlineMediaPicker.jsx; src/styles/admin-inline-media.css; scripts/check-inline-media.mjs.
Changed: src/components/admin/CMSEditorControls.jsx; src/components/admin/CatalogueForms.jsx; src/components/admin/ProductEditor.jsx; src/components/home/HomeHero.jsx; src/pages/admin/CMSWorkspace.jsx; src/mock-data/cmsEditor.js; src/services/catalogueApi.js; backend/tests/cms.php.

No runtime PHP files, private credentials, backend configuration or database migrations changed. No deployment or commit performed.
