# COD-only deployment and acceptance checklist

Status: BLOCKED, not approved for public launch. No public order activation performed.

## Prerequisites

- [ ] Owner confirms private database backup and deployment inventory (through007 confirmed).
- [ ] Resolve ready503 using private audit-readiness.php; all schema/ledger checks pass. Never fabricate migration records.
- [ ] Resolve settings/public404 and publish reviewed homepage/content; initialize missing CMS drafts only through the existing documented CMS workflow.
- [ ] Install matching Phase7H PHP/frontend packages, preserve config.php and /api, verify rewrite exclusions and private-path denial.
- [ ] Supply a separate disposable hosted MySQL database for existing catalogue-database.php and commerce-mysql.php harnesses. These destructive harnesses must never target production. Run their documented opt-in prerequisites and concurrency/rollback checks; no credentials in chat.
- [ ] Verify actual permissions, authenticated sessions/CSRF and owner isolation on hosted PHP. Offline SQLite tests do not substitute for InnoDB tests.
- [ ] Razorpay remains explicitly disabled; no public SDK/payment button, no gateway calls. Missing merchant keys alone do not block COD.

## Owner-controlled acceptance gate

All gates are cumulative: private commerce.order_acceptance_enabled, business_settings.accept_orders, maintenance disabled, valid delivery/tax/COD configuration, authentic prices/stock, and the new private launch gate. Nothing here changes existing config.php automatically.

After prerequisites and explicit approval for controlled real orders, owner may create private `domains/virasatorganics.com/private/virasat-backend/config/launch.php` from the supplied example:

```php
<?php
return [
    'mode' => 'acceptance',
    'customer_ids' => ['REPLACE_WITH_ACTUAL_TEST_CUSTOMER_ID'],
    'acceptance_completed' => false,
];
```

Use the actual server customer ID, not phone or Firebase token; at most five exact IDs. All other customers remain blocked by this gate. Owner manually enables the existing commerce/business/delivery gates only when authorized for acceptance. Never change database credentials. An absent launch.php or mode disabled closes ordering. No production test order has been placed by this audit.

## Manual acceptance — record actual results and safe order references

1. Admin login, refresh session and permission checks.
2. Admin configures genuine selling prices and stock with movement reasons.
3. Set intended products Active; inactive must be inaccessible, out-of-stock/coming-soon cannot purchase.
4. Configure actual serviceable PINs, distance policy, delivery charges, tax and COD.
5. Customer signs in using real Firebase OTP; no tokens/OTP in evidence.
6. Select Google Places result and confirm coordinates; test map pin and manual-address fallback. Verify profile/default-address persistence after logout/relogin and address ownership denial.
7. Add a genuine in-stock product; wishlist persists and cart quantity/status rules hold.
8. Confirm server quote items, shipping, tax and total; expired/changed quote is rejected.
9. Place an explicitly approved controlled COD order as an allowlisted customer. Retry the same key; exactly one order/deduction. Confirm a non-allowlisted customer cannot order.
10. Admin sees the same order and complete delivery snapshot; COD remains unpaid.
11. Admin applies legal status transitions; unauthorized transitions fail. Only permitted collection records can mark COD collected after delivery.
12. Customer tracking reflects committed status changes and cannot read another customer's order.
13. On a separately approved eligible order, cancel twice and verify exactly one restock and matching ledger. Concurrent last-stock tests belong on disposable MySQL first.
14. Publish/revise genuine CMS content/media and verify public pages, reports and notifications reflect committed changes; print order summary is not represented as a tax invoice.
15. Logout, expired session, guest401, missing/invalid CSRF403, unrelated-origin rejection and permission denials work.

Repeat layout/keyboard checks at 320,375,390,430,768,1024,1280,1440px for shop/product, checkout, login/address, admin tables/CMS, modals and drawers. Verify focus, escape/back navigation, visible errors, image proportions and no overflow. Refresh product/category/blog/account deep links. Actual signed-in forms/provider checks remain pending.

## Public COD activation — only after every prerequisite and acceptance passes

Owner explicitly approves activation and privately changes launch.php to mode `public`, customer_ids `[]`, acceptance_completed `true`. Existing commerce/business gates must also remain valid. This boolean records an owner decision; it is not an automated certification. Check commerce/status and a final authorized order flow. Monitor private errors, stock, orders and unpaid COD. Emergency stop: set launch.php mode `disabled` immediately; existing order history remains accessible. Keep Razorpay disabled.
