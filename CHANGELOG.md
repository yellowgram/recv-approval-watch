# Changelog

## 0.1.0

- Receive-side watch: Approval / ApprovalForAll where agent is owner or spender; emit unexpected_approval
- clearanceFromWatch compose helper (fail-closed when watch unhealthy)
- Revoke-intent emitter that NEVER signs (unsigned tip only)
- Permit2-watch opt-in only (`permit2WatchStub` defaults false) — not the lead P0 job
- Offline `demo:offline` fixtures + vitest; sealed honesty lines
- Public MIT source on GitHub; **not published to npm**; no Polar
