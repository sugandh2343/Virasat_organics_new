# Phase 2 — Homepage finalization

## Sections and configuration
The fixed announcement/header and footer surround these homepage sections: hero, categories, collection, introductory video, editorial gallery, story preview, brand values, journal and newsletter. Testimonials are disabled and contain no entries.

`src/mock-data/home.js` owns all homepage copy, CTA labels/routes, media slots and journal selection. Its `sections` array controls each section with stable `id`, numeric `order` and `enabled`. HomePage sorts enabled sections and ignores duplicate/unknown IDs. Header/footer remain part of SiteLayout. `shopping`, `media`, `story`, `values`, `journal`, `testimonials` and `newsletter` group content by purpose. These objects are returned by getHomepageContent through the existing mock service boundary. No CMS editor or API is implemented.

`src/mock-data/categories.js` supplies the two shopping categories. `products.js` retains exactly five independent records with no invented pricing/stock. `blogPosts.js` contains three explicitly labelled editorial drafts, with null author, publication date and body. `journal.postIds` controls homepage selection/order. getBlogPosts still returns published content only; getEditorialPreviews explicitly includes opted-in editorial drafts. Linked `/blog/:slug` pages clearly state that the full article awaits editorial review. `/blog` lists these previews.

Testimonials render only approved entries with quote/name, and the empty component renders nothing even if enabled. No ratings, identities or reviews have been fabricated. Newsletter validation is browser-local React state only: a valid entry displays “Newsletter subscriptions will be available soon”. It never saves, sends or registers an address.

## Media replacement
See `public/assets/MEDIA_GUIDE.md`. Add approved files before configuring their URLs. Hero/introductory video both use `home.video` and the shared VideoModal implementation. Story preview: put an approved photo at `public/assets/story/heritage.webp` and set `home.story.image.src` to `/assets/story/heritage.webp`, with accurate alt text. Journal: add approved images to `public/assets/blog-images/` (suggested atta-cooking.webp, mustard-kitchen.webp, family-food-traditions.webp) and assign each draft's `image` as `{src,alt,srcSet?,sizes?}`. Existing image utilities provide lazy loading, reserved proportions and failure fallbacks. Preview illustrations are not authentic product photography.

## Changed files in Prompt 2.4
Added `src/components/home/HomeEditorial.jsx`, `src/styles/home-editorial.css`, `scripts/check-homepage.mjs` and this document. Updated HomePage, HomeShopping and HomeMedia to support configurable independent sections; homepage/blog mock data; contentService; FoundationPage for the requested journal destinations. Existing header, hero, product cards, footer and media player implementation remain intact. Build regenerates dist. No dependencies added.

## Validation
Passed: `npm run build`; `node scripts/check-foundation.mjs`; `node scripts/check-navigation.mjs`; `node scripts/check-design-system.mjs`; `node scripts/check-home-shopping.mjs`; `node scripts/check-media.mjs`; `node scripts/check-homepage.mjs`.
New checks cover configured section order and unique IDs, hidden empty testimonials, draft-only article provenance/routes, story CTA, newsletter honesty and no storage/network submission code, shared video implementation and absence of fabricated certification/review data.
Browser checks: requested section order, three journal cards, draft destinations, story/all-articles links, required-email and coming-soon newsletter messages, mobile drawer and search. Responsive widths 320, 390, 768, 1024 and 1440 have no horizontal overflow. Desktop/mobile visual checks completed. No failed automated checks remain. Real video playback and authentic photography cannot be verified until supplied.

## Still needed
Approved logo, genuine product/category/gallery/story/journal photos, introductory MP4/poster/captions, verified prices/stock/product details, reviewed journal bodies, genuine approved testimonials (optional), confirmed business/legal content. No subscription service is connected.
Full product details, shopping/cart/checkout, customer account, admin editor and production backend remain later work. Informational routes remain foundation shells apart from journal preview handling. No deployment or commit was made. The previous website directory was not touched.

Local preview: http://127.0.0.1:5174/
