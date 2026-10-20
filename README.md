# recv-approval-watch (deprecated)

**This package is merged into [`l2-send-guard`](https://github.com/yellowgram/l2-safety-proxy) 1.x and gets no more fixes.**
Version 0.2.0 behaves exactly like 0.1.0 and prints one deprecation warning when imported.

## Why

recv-approval-watch did one slice of a bigger job (watching approvals the agent grants). On its own it had gaps that a single tool closes better:

- Permit2 approvals were only watched behind an opt-in stub flag.
- An unexpected approval was reported but didn't stop the agent's next send.
- It needed its own log ingestion; there was no watcher with a saved cursor.

`l2-send-guard` 1.x checks every call inside a transaction against one policy file, gates EIP-7702
delegations, keeps rolling caps and idempotency keys in a persistent store, watches what arrives, and
ships a guarded signer that applies the policy to the transactions, typed data and 7702 authorizations it
signs, and refuses plain messages unless you allow them.

## Migrating

```sh
npm uninstall recv-approval-watch
npm install l2-send-guard
```

What you used here is now `L2SG_WATCH_AGENTS` on the proxy, or `watchInbound` / `scanOnce` imported from `l2-send-guard` (findings of kind `approval`, with unsigned revoke calldata). An unexpected approval locks the agent's sends (`-32088`) until you run `l2-send-guard unlock`.
The full guide is at https://github.com/yellowgram/l2-safety-proxy#migrating.

## License

MIT
