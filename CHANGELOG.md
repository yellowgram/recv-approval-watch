# Changelog

## 0.2.0

- Deprecated. Merged into `l2-send-guard` 1.x, which fixes nested-call decoding, EIP-7702 authorizations, cumulative limits, ungated submit methods and memory-only state. This version behaves like 0.1.0 and emits one `DeprecationWarning` on import.
- Removed internal planning files.

## 0.1.0

- Receive-side watch: Approval / ApprovalForAll where agent is owner or spender; emit unexpected_approval
- clearanceFromWatch compose helper (fail-closed when watch unhealthy)
- Revoke-intent emitter that NEVER signs (unsigned tip only)
- Permit2-watch opt-in only (`permit2WatchStub` defaults false)
- Offline `demo:offline` with fixed fixtures, and tests
- MIT licensed
