# Offline demo

No keys, no signing, no auto-revoke, no public RPC.

```bash
npm ci
npm test
npm run build
npm run demo:offline
```

`demo:offline` exits non-zero if stdout drifts from [`fixtures/offline.expected.txt`](./fixtures/offline.expected.txt).

What it shows (sealed allow **and** deny-style codes):

1. Unexpected Approval (agent owner) → `unexpected_approval`
2. Expected spender (finite) → `expected_ok`
3. ApprovalForAll(true) unexpected → `unexpected_approval_for_all`
4. Agent as spender inbound → `unexpected_approval`
5. Permit2Allowance under default (`permit2WatchStub` off) → ignored `expected_ok`
6. Revoke-intent → `signed=false` / `revoke_intent_emitted`
7. Expected + unlimited → still `unexpected_approval`
8. Expected + ApprovalForAll(true) → still `unexpected_approval_for_all`
9. ApprovalForAll(false) clear → `expected_ok`
10. Clearance degraded → deny `approval_watch_degraded`
11. Clearance healthy → allow `expected_ok`

Fixture SoT; tandem with send-approve-bound. Not a Permit2-watch product.
