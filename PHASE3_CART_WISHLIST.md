# Phase 3 — Static cart and wishlist

## Implementation
/cart now has product rows, independent pack sizes, unit/line prices, stock-bounded quantity controls, removal, Continue Shopping, confirmed Clear cart and an order-summary sidebar. Mobile stacks the content. /wishlist displays saved visible products through the existing ProductCard, supports removal and eligible additions, and has an empty state.

The existing header cart icon opens CartDrawer without changing the header design. DrawerShell retains native dialog focus containment, Escape/backdrop dismissal, focus restoration and background scroll locking. The drawer reuses the same CartItems and CartSummary as /cart and links to View Cart and checkout. Its entrance animation respects reduced motion.

The existing /checkout remains a placeholder. CheckoutPreview gates access using cart eligibility; it never creates orders or payments. Shipping/tax configuration is null, so no final total is displayed. A subtotal is shown only when every line has a configured numeric price. Valid purchasable carts may proceed to the placeholder even while final shipping/tax costs remain pending.

## State and persistence
The original StorefrontContext/reducer remains the single store. New actions cover removal, clear and quantity changes. Catalogue reconciliation runs before restored data is displayed and again on window focus:
- Unknown and inactive products are removed from cart/wishlist.
- Duplicate cart IDs merge; quantities clamp to positive configured stock and the existing 99-unit cap.
- Visible unavailable cart entries remain flagged with purchasing disabled.
- Wishlist permits visible Coming Soon/Out of Stock products.
- Production additions resolve against the current loaded catalogue, not caller-supplied product prices.
- Header cart count sums units; wishlist counts unique saved products.

The versioned key remains virasat-v2:local-preview:v1 for compatibility. Only cart, wishlist and location persist. Corrupt/invalid data recovers to sanitized empty state; blocked storage falls back to memory. Storage events synchronize tabs, including removal/clear events, without repeatedly writing identical values. Last arriving storage update wins; this is not a transactional multi-device service.

An optional provider storageKey supports isolated tests without touching normal saved state. Catalogue/services remain local async mocks, ready for a later API adapter. There are no new external APIs or dependencies.

## Changed files
Added:
- src/domain/cartSelectors.js
- src/mock-data/cart.js
- src/components/cart/CartContents.jsx
- src/components/cart/CartDrawer.jsx
- src/pages/CartPage.jsx
- src/pages/WishlistPage.jsx
- src/pages/CheckoutPreview.jsx
- src/styles/cart.css
- scripts/check-cart-wishlist.mjs
- PHASE3_CART_WISHLIST.md

Updated StorefrontContext.jsx, state/store.js, Header.jsx, SiteLayout.jsx and App.jsx. Production dist regenerated.
Homepage, shop, product page sources, product fixtures, footer and old website were not modified. Temporary browser QA harness files were removed.

## Validation — 16 October 2026
npm run build passed. All ten check scripts passed, including the new check-cart-wishlist.mjs.
Tests cover add/remove/clear, quantity caps, separate pack IDs, missing prices/stock, status gating, catalogue ID validation, duplicate reconciliation, subtotal/final-total rules, header counts, JSON storage roundtrip/corruption handling, synchronization reducer, wishlist and rendered cart controls.

Browser checks:
- Header drawer opens; Escape and backdrop dismiss it; focus restores and background scrolling unlocks.
- Empty cart prevents checkout.
- Wishlist add/remove, refresh persistence and actual cross-tab storage synchronization verified.
- Populated-cart UI tested with explicitly labelled isolated synthetic prices/stock and a separate storage key: quantity cap, header unit total, drawer removal, valid checkout placeholder handoff, Clear cart cancel/confirm.
- Real catalogue prices and stock were never populated. Test storage was cleared and temporary test files removed.
- Wishlist and populated-cart layouts checked at 320, 390, 768, 1024 and 1440px without horizontal overflow. Mobile drawer visually reviewed.

## Pending functionality
All five real mock records remain Coming Soon with null prices/stock, so purchase buttons stay disabled. Authentic photos and verified prices/inventory are still required.
Shipping, taxes and final totals need verified settings. Checkout, authentication, COD, orders, real payments and PHP/MySQL persistence are not implemented. Browser-local data is not shared with a server and is not a stock reservation.

No deployment or commit. Old website untouched.
Preview: http://127.0.0.1:5174/cart
Wishlist: http://127.0.0.1:5174/wishlist
