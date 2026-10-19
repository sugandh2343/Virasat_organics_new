# Phase 5.4 — Static CMS and business settings

## Delivered and preview URLs

The existing V2 application now includes session-only homepage, banner, story, blog, policy-page and business-settings editors. The approved storefront structure and design remain in use. Original products and three editorial ideas are preserved. No business facts, registration numbers, reviews, legal policies or published articles were added to fixtures. No dependencies, backend services, deployment or commit were introduced. The old website directory was not accessed or modified.

- Homepage: http://127.0.0.1:5174/admin/content (also /admin/content/homepage)
- Banners: http://127.0.0.1:5174/admin/content/banners (existing /admin/banners retained)
- Story: http://127.0.0.1:5174/admin/content/story (existing /admin/story retained)
- Articles: http://127.0.0.1:5174/admin/blog
- New article: http://127.0.0.1:5174/admin/blog/new
- Edit article: /admin/blog/:id/edit
- Pages: http://127.0.0.1:5174/admin/pages
- Settings: http://127.0.0.1:5174/admin/settings
- Existing delivery, payment and compliance settings paths open their corresponding tab.
- Shared media selection remains at /admin/media.

Use the same running tab/session to move between admin and public previews. Reload restores immutable seed fixtures; edits are not localStorage-backed and are not shared with another tab or server.

## Editor inventory

### Homepage

The section manager retains all ten original section IDs. It provides visible/hidden controls, accessible up/down ordering, section copy fields, CTA labels/destinations, shared-media selection and reset-to-default controls. Reset restores section copy, visibility and original position in the unsaved draft.

Hero controls include headline, emphasis, description, two CTAs, showcase title/caption and independent photo slots. Categories and collection retain their existing shopping services. Introductory video/poster, seven gallery slots and their ordering/captions/alt text, story preview, all four values, journal selection and newsletter wording are editable. Testimonials remain restricted to existing approved records; the empty collection cannot produce fabricated reviews.

Announcement and footer-description controls are pinned. They update the same business settings used by Header/Footer rather than a second persisted copy. Disabling these controls hides their optional text, never the mandatory header/footer. Disabled commerce sections retain their underlying routes and components.

Show live draft preview renders the existing HomeContent components plus pinned text. Links are prevented from navigating within that draft preview. Save session changes applies the draft to the shared mock adapter; public edited homepage content is explicitly labeled local preview.

### Banners

Searchable/sortable list and add/edit/archive/delete controls. Records include title, desktop/mobile image references, alt text, CTA label/destination, active/inactive status and sort order. Active banners render above the homepage sections in configured order. Empty seed banners produce no extra section. Mobile falls back to the desktop image when no mobile file is selected. Preview images remain temporary browser files.

### Story, articles and pages

The reusable document editor supports title, intro/excerpt, SEO fields and ordered paragraph, heading, quote, list and image blocks. Images come from the existing media library. The story page additionally supports video/poster selection; highlights can use heading/list/quote blocks. Multiple photos are supported as image blocks. No founding or heritage facts were invented.

Blog titles, unique slugs, article categories, featured images, excerpts and bodies are editable. New drafts are hidden publicly. The original three opted-in editorial previews retain their honest draft presentation until explicitly published. Publishing requires reviewed nonempty blocks and confirmation. Locally published records are marked as demo content, not actual publication; no author or official publication date is invented. Unpublishing/archiving hides article bodies from public article lookup. Original draft ideas may be archived but cannot be deleted; new articles can be deleted with confirmation.

About, Contact, Our Story, Privacy, Terms, Shipping, Returns/Refunds and FAQ remain on stable routes. Core page slugs cannot be renamed or deleted. Draft bodies are available in admin preview only; public views show a draft notice. Policy publication is explicitly a local action, not legal approval.

### Business settings

Tabs: General, Compliance, Store, Delivery, Payments and SEO.

General includes display name, shared-media logo, alt text, support email/phone/WhatsApp, address, operating hours, social links and footer description. Store includes INR, maintenance display, order-acceptance preference, contact visibility, announcement and footer controls.

GSTIN and FSSAI values have independent visibility flags and format validation. Public labels require BOTH a valid nonempty formatted value AND visibility enabled. Missing/invalid/hidden values render neither the value nor its label. Format validation does not establish registration or legal authenticity. Optional registration notes remain admin data.

Delivery stores allowed PINs, explicit demo coverage, shipping charge, free-shipping threshold, minimum order and optional typed origin. The product PIN preview reads these current shared settings and clears stale feedback when they change. COD has one shared boolean used by both Delivery and Payments forms. Razorpay is permanently disabled; no credential fields exist, and credential-shaped input keys are rejected.

Store maintenance is a display notice rather than a route blockade. Order acceptance, configured shipping amounts/thresholds/minimum order and COD settings do not enable live checkout or alter the deliberately isolated development checkout fixture. Those commercial rules remain configuration for later integration; the public checkout's existing safeguards and unconfigured tax behavior are preserved.

SEO title updates the site browser title. Description, social image and site URL metadata are stored for future full metadata integration; per-page SEO is editable but does not yet implement a complete dynamic meta-tag/canonical/Open Graph system.

## Shared data contracts and synchronization

mockStore.js remains the only CMS/catalogue/settings store. Mutations clone existing data, validate, commit atomically and notify subscribers. The older settings-update helper now also notifies. useAsyncData and BusinessProvider refresh through the existing subscription mechanism.

- Homepage: original sections array with id/order/enabled and content groups. A transient editor chrome bundle updates allowlisted business fields atomically and is not persisted as a competing homepage setting.
- Banner: stable ID, title, desktop/mobile mediaId references, alt, CTA, status, sortOrder and actual local updatedAt.
- Blog/page: stable ID/slug, title, excerpt/description, category where relevant, ordered blocks with id/type/text/mediaId/alt, image/video references, status, SEO and localPreview flag.
- Business: existing branding/contact fields plus visibility/display settings, delivery object, one codEnabled boolean, fixed disabled Razorpay flag and SEO metadata.
- Media: references point to the existing productMedia library. Public services project latest object URLs/metadata at read time. Files referenced by homepage, banners, pages, articles or settings cannot be removed until unassigned. Existing product/category/poster reference safeguards remain intact.

Public homepage, banners, story/page views, journal listing/article lookup, logo, contact information, footer, announcement, maintenance notice and compliance display consume shared data. Body blocks render as React text elements; HTML is never injected. HTTPS URLs are validated, and local CTA paths must match available public/customer routes or current product/category/article records.

Form drafts are local component state until saved. Save/Cancel, dirty status, navigation/beforeunload warnings and publication/destructive confirmations are shared controls. Page/banner editor selection uses URL query parameters, so returning to a list passes through the existing unsaved-navigation blocker. Save feedback appears only after a successful local mutation.

Reset Demo Data in content lists resets the entire existing mock store, including catalogue defaults and media cleanup. It does not invent or delete independent customer-session order histories.

## Changed files

New:
- src/domain/contentSelectors.js
- src/services/cmsAdminService.js
- src/mock-data/cmsEditor.js
- src/components/admin/CMSEditorControls.jsx
- src/components/admin/ContentDocument.jsx
- src/components/home/ContentBanners.jsx
- src/pages/admin/CMSWorkspace.jsx
- src/styles/cms-admin.css
- scripts/check-cms-settings.mjs
- PHASE5_CMS_SETTINGS.md

Updated:
- src/services/mockStore.js, contentService.js, deliveryService.js, catalogueAdminService.js
- src/state/BusinessContext.jsx
- src/layouts/SiteLayout.jsx
- src/routes/adminRegistry.js
- src/pages/HomePage.jsx, FoundationPage.jsx
- src/pages/admin/AdminManagementPage.jsx, AdminDashboard.jsx
- src/components/Header.jsx, Footer.jsx
- src/components/home/HomeHero.jsx, HomeShopping.jsx, HomeEditorial.jsx
- src/components/product/DeliveryPreview.jsx
- scripts/check-navigation.mjs
- dist/ regenerated.

The navigation regression previously expected an arbitrary invalid registration string to become visible when its flag was enabled. That assertion was deliberately tightened to require format validity, as requested. Synthetic format-only identifiers are used only in isolated tests and never added to browser fixtures.

## Actual validation — 17 October 2026

- npm run build: PASS. Final build: Vite 7.3.7, 1,730 modules, 3.30 seconds. Main JS 478.38 kB; lazy CMS chunk 29.80 kB. No warnings.
- All 18 scripts/check-*.mjs: PASS. Includes the 17 previous regressions and new CMS/settings coverage.
- After final pinned-control styling and dashboard copy polish, build plus affected check-admin.mjs and check-cms-settings.mjs were rerun: PASS.
- New tests cover section editing/visibility/order/reset, pinned shared text, banner add/edit/archive/delete, story preview/publication, draft/publish/unpublish behavior, slug uniqueness, raw-HTML rejection/escaped text, list rendering, core-page route preservation, settings validation, credential rejection, conditional compliance display, PIN coverage, COD shared data, media type/reference protection, notifications, reset and editor markup.
- Unsaved-change and publication-dialog wiring is checked in source/server-rendered markup. This is not an interactive browser test.
- HTTP GET to /admin/content, /admin/content/banners, /admin/content/story, /admin/blog/new, /admin/pages and /admin/settings: 200 on port 5174.
- Browser visual and interactive checks at 320–1440px: **BLOCKED** by the established browser URL security restriction. No visual PASS, overflow measurements, focus restoration, drag/drop or click-through claim is made. CSS parses successfully; responsive styling and SSR markup are implemented.

Commands: npm run build; enumerate scripts/check-*.mjs and run each with Node; targeted node scripts/check-admin.mjs and node scripts/check-cms-settings.mjs; Invoke-WebRequest HTTP checks. All test data are synthetic and process-isolated.

## Known limitations and required real inputs

No permanent saves, server uploads, authentication, authorization, real publication, subscription service, legal verification, maps/geocoding, payments or database exist. Static admin routes remain explicitly unsecured previews. No raw-HTML/WYSIWYG parser is used; rich content is limited to supported safe structured blocks.

Still needed: approved logo/photos/video/posters, reviewed brand history and value claims, approved article bodies, real optional approved testimonials, independently reviewed policy text, confirmed contact/address/hours/social information, actual GSTIN/FSSAI values if applicable, authoritative delivery/COD/commerce rules and production SEO URLs. No credentials are required or accepted for this phase. Future payment credentials must stay on an authorized backend, never in frontend code/data.

## Future PHP/MySQL mapping

| Current adapter operation | Future authenticated endpoint |
| --- | --- |
| Homepage read/save | GET/PUT /api/admin/content/homepage |
| Banner list/create/update/archive | GET/POST /api/admin/banners, PATCH/DELETE /api/admin/banners/:id |
| Story and core pages | GET/PUT /api/admin/pages/:id |
| Blog CRUD and publication | GET/POST /api/admin/blog, PATCH/DELETE /api/admin/blog/:id, explicit publish endpoint |
| Business/settings groups | GET/PATCH /api/admin/settings |
| Shared media references | Protected media upload/metadata endpoints and durable media IDs |
| Public published content | Read-only public endpoints with server-enforced publication/visibility filters |

Add real role/permission checks, authenticated sessions, schema validation, sanitized structured content, stable database IDs, optimistic versions, transactions, revision history, approval/audit workflows, safe file handling and server-side publication filters. Enforce compliance visibility again on the server and treat format checks separately from verification. Replace the adapter and invalidate current subscriptions after successful writes; do not duplicate presentation stores. Reset Demo Data must remain development-only.

Remaining work: unblock browser acceptance testing, provide approved content and implement backend/commerce integration only in later authorized phases.
