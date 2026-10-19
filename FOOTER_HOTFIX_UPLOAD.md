# API footer hotfix — 2026-10-19

Confirmed source defect: Footer used socialPlaceholders.map when socialLinks was empty. PHP returns socialLinks but no mock-only socialPlaceholders. Normalize missing/null arrays to empty lists; retain configured links and explicitly supplied mock placeholders. No database settings, auth or backend changes.

Changed: src/domain/contentSelectors.js, src/components/Footer.jsx, src/state/BusinessContext.jsx (named context export for rendering tests). Added scripts/check-footer-api.mjs. Build PASS; footer SSR empty/missing/null/configured lists PASS; CMS API/settings and production deployment checks PASS. Live browser after upload remains owner verification; no deployment performed.

Package: D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-footer-hotfix.zip. Contents are dist files at ZIP root. Archive integrity and source bytes verified; inventory in deployment/footer-hotfix-checksums.json.

Back up current public_html/index.html and assets. Extract ZIP locally. Upload assets into domains/virasatorganics.com/public_html/assets/ first; replace public_html/index.html last. Other root static assets are included; .htaccess and robots.txt are unchanged from Phase7H and need not replace already-installed copies. Preserve public_html/api and all private backend/config/media paths. Do not delete older hashed assets during rollout.

Hard-refresh Ctrl+Shift+R; if host/CDN caches index.html, purge that file. New main bundle: assets/index-DTW65w4R.js. Check /shop and homepage; footer must render with no social links and no .map exception. Unpublished CMS homepage is a separate content setup condition, not solved by this patch. No further SQL is required for this crash. Roll back by restoring the previous index/assets if needed.
