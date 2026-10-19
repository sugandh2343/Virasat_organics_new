# Deferred Razorpay activation — separate from COD launch

Do not activate now or merely flip a credential flag tomorrow. Phase7E implements guarded provider infrastructure; the current quote/placement path is COD-only. Online placement/reservations, expiry, cancellation/refund orchestration and reconciliation must be completed and tested before public payment activation. Never convert a live COD order to online manually.

- [ ] Complete online order/reservation lifecycle and private reconciliation procedures.
- [ ] Approved merchant account; keep test/live key pairs and webhook secrets only in private configuration, never Vite or public CMS.
- [ ] Isolated MySQL tests for stock reservation, simultaneous webhook/verify, retries, duplicates and rollback.
- [ ] Real provider test-mode success, failure, dismissal, authorization vs capture, wrong amounts, delayed capture, expired reservations and refund review.
- [ ] Configure exact HTTPS webhook endpoint `/api/payments/razorpay/webhook`; verify raw-body HMAC, event idempotency, retries and out-of-order delivery. No browser callback alone marks paid.
- [ ] Validate checkout signature against server-stored order ID, then provider amount/currency/captured status.
- [ ] Resolve uncertain provider order creation by receipt reconciliation; never blindly recreate.
- [ ] Test secret rotation, alerts and recovery; verify no session/CSRF bypass on customer endpoints.
- [ ] Explicit owner approval for live credentials and controlled live acceptance; only then enable the public online choice and on-demand SDK.

Razorpay was not contacted by Phase7H tests. Its missing credentials do not prevent correctly tested COD operation.
