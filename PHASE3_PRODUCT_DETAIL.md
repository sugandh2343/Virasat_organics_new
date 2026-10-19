# Phase 3 — Product detail pages

## Delivered
All five independent /product/:slug routes load through the existing local mock service. Unknown and inactive records produce the existing friendly 404. Vite direct navigation and refresh work. Desktop uses an approximately 55/45 editorial split; mobile places the gallery first.

Each page includes breadcrumbs, category, independent pack size, demo SKU, honest price/status, short-description placeholder, wishlist, quantity controls, local cart action, delivery-location preview and shipping link. Six native details sections display centrally configured content or an explicit pending-details message. Specifications accept named fields for quantity, product type, packaging, MRP, origin, shelf life, manufacturer/packer, batch and FSSAI information without supplying invented values.

Related products use the same category, exclude the current record and inactive records. Atta has no related items in its category, so its related section is hidden.

## Files
Added:
- src/domain/productDetailSelectors.js
- src/mock-data/productDetail.js
- src/styles/product-detail.css
- scripts/check-product-detail.mjs
- Five public/assets/products/<product-folder>/README.md files
- PHASE3_PRODUCT_DETAIL.md

Updated:
- src/pages/ProductPage.jsx
- src/components/media/ProductMediaViewer.jsx
- src/state/store.js (optional quantity on cart/add; existing calls retain increment-by-one behavior)
- public/assets/MEDIA_GUIDE.md
- dist production output

No new dependencies. Product fixtures, homepage, header/footer, shop/search and route registry unchanged. Old website untouched.

## Data and media
Product content and images[]/videos[] remain on each individual mock product record. The viewer supports unlimited images and videos, thumbnails, previous/next controls, keyboard navigation, existing lightbox and video player, poster support and missing-source fallbacks. Five labelled suggested image slots appear when images are absent. Media selection resets when navigating to another product.

See public/assets/MEDIA_GUIDE.md and the five reserved product folders for asset configuration. Actual image/video URLs belong in centralized product data. No genuine photos or MP4s have been supplied.

## Purchase behavior
Shared eligibility selectors gate quantity and purchasing. Quantity begins at one and is bounded by configured stock, the existing 99-item local-cart cap and quantity already in the cart. The reducer validates positive integer additions and clamps the total. Wishlist/cart are browser-local only. The UI explicitly states that checkout is unavailable. All five current records remain coming_soon with null price/stock; their quantity and purchase controls are disabled. No fake purchase or payment success is shown.

## Validation — 16 October 2026
npm run build passed. All eight scripts passed: check-design-system, check-foundation, check-home-shopping, check-homepage, check-media, check-navigation, check-shop and check-product-detail.

New tests cover all five slug lookups, unknown/inactive lookup, status and missing price/stock, quantity boundaries and multi-quantity reducer caps, related filtering, multi-image/video array normalization and missing-video fallback. Eligible prices and stock exist only in isolated test fixtures.

Browser checks:
- All five detail URLs render the correct names and independent sizes.
- Direct refresh succeeds; unknown slug renders 404.
- Thumbnail selection changes active media; enlarge opens the lightbox; ArrowRight advances and Escape dismisses.
- At 320, 390, 768, 1024 and 1440px, no horizontal overflow; mobile is stacked and desktop has two columns.
- Desktop gallery/purchase composition visually reviewed.
- Current unavailable quantity and cart controls disabled.

Real photograph rendering and MP4 playback cannot be validated against authentic assets until they are supplied. Existing media checks exercise absent-video rendering without a broken player.

## Remaining work
Approved photography, product-specific MP4/poster/captions, verified product descriptions, ingredients, nutrition, specifications, storage, prices/stock and final shipping/returns terms. Complete cart experience in Prompt 3.4; checkout, real payments, login and backend/admin CRUD remain later phases. No deployment or commit.

Preview: http://127.0.0.1:5174/product/black-mustard-oil-500ml
