# Analytics audit corrections

The owner approved correction of the analytics audit. Register the 14 missing JavaScript goals without changing existing goals or counter settings. Counter 113068094 already has ecommerce enabled; connect its dataLayer in the application.

Purchase events must represent a successful, positive-value payment confirmed by the server. Free owner access, pending/canceled payments, other users' purchases and purchases completed before rollout must not generate new sales. A database claim gives only one browser permission to send each purchase. It is an at-most-once permission, not proof of delivery to Yandex.

Send only after cookie consent and SDK readiness. Late consent must work while the application is open. Report-open events wait while their report remains mounted. Unmounted views must not replay. Never send purchase IDs, user IDs, email, birth data, location or intentions. Ecommerce carries an independent random transaction UUID, a static product name and the actual amount in RUB.

Keep payment, report access, prices, cookie copy/actions/storage, legal text, domain restriction, own-visit filtering and Webvisor privacy unchanged. No new dependency or external service. Submit code as a PR; the owner merges and deploys.
