# Phase 3 — Static shop browsing

## Functionality
/shop presents The Virasat Collection with breadcrumbs, botanical accent, category shortcuts, live result count and responsive product cards. /shop/category/:slug provides category copy and a friendly missing-collection state. /search shares the same browsing experience.

Category, availability, search and sorting compose in URL parameters (category, availability, q, sort, min, max). Desktop controls apply immediately. The mobile native-dialog drawer stages selections until Apply; Reset clears draft filters, and Escape/dismiss discards unapplied changes. Reset on a category page retains that route's category; All products returns to the entire catalogue. Empty-result reset also clears the search query.

Search matches normalized names, categories, pack sizes, configured discovery aliases and optional product keywords. Unit aliases and case/whitespace normalization are retained. Default sort preserves catalogue order; name sorts are stable. Numeric price controls appear only when public records have valid prices. Unknown prices sort last in either price direction and are excluded by a specified price range.

Cards reuse ProductCard, price/status/image components and the existing local wishlist/cart state. Name and image links open the existing product detail shell. Purchasability and availability use shared product selectors; inactive records are excluded from lists, search and direct lookup. No variants or new products.

## Changed files
- src/pages/ShopPage.jsx: shared browsing UI, category routes, URL state and mobile drawer.
- src/pages/SearchPage.jsx: existing route delegates to the shared browsing UI.
- src/domain/catalogueSelectors.js: composable filtering/sorting and category resolution.
- src/services/searchService.js: includes canonical size and optional per-product keywords.
- src/styles/shop.css: scoped premium shop styling and responsive grid.
- scripts/check-shop.mjs: catalogue regression tests.
- PHASE3_SHOP.md: this report.
- dist: regenerated production output.

No dependencies added. Homepage, header, footer, product fixtures and old website were not modified.

## Mock dependencies
Products and categories load asynchronously through getProducts/getCategories and the existing local mock store. Product visibility and availability come from productSelectors. Search aliases remain in mock-data/search.js. Wishlist/cart use StorefrontContext; persistence is browser-local only. There are no new network APIs, authentication or payment operations.

## Validation — 16 October 2026
Passed npm run build and all seven scripts: check-foundation, check-navigation, check-design-system, check-home-shopping, check-media, check-homepage and check-shop.

New tests cover two category filters, invalid category resolution, all/available/coming-soon/out-of-stock availability, combined query/category/availability, default/name/price ordering, normalized search, empty matches, inactive exclusion including direct detail lookup, conditional numeric prices and range bounds. Numeric amounts exist only in isolated test fixtures; live catalogue prices remain null.

Browser QA on the Vite development server:
- /shop shows exactly five products; category pages show one atta product or four oils.
- Invalid category slug displays a friendly collection-not-found state.
- /search?q=YELLOW%201%20LITRE finds one product.
- Mobile category + Coming Soon + BLACK 500 ml finds one matching independent product.
- Available produces zero results; Reset restores five products.
- Z–A sorting, mobile draft Reset/Apply, Escape dismissal and wishlist toggle verified.
- All five live cart buttons disabled; price filters/sorts absent.
- Widths 320, 390, 768, 1024 and 1440: no horizontal overflow; grid columns 1, 2, 3, 3 and 4 respectively. Mobile and desktop screenshots visually reviewed.
- Fixed desktop mobile-filter button specificity during QA.

Preview: http://127.0.0.1:5174/shop

## Placeholders and next tasks
Authentic product photography, verified pricing/stock and full product details remain pending. All five launch records are Coming Soon. Numeric filtering is tested with isolated fixtures because no real prices have been supplied. Product details, checkout, customer login and admin screens remain their existing shells for later phases. No backend, deployment or commit. No implementation blockers.
