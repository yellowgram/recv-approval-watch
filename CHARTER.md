# recv-approval-watch — charter fences

**Status:** public GitHub · not on npm · LaunchGate-before-expansion  
**As of:** 2026-09-30 (ET)

This package is a **narrow** receive-side watcher. Keep the surface honest. Public GitHub source is OK. No npm publish and no Polar until founder + LaunchGate.

## Job (P0)

Watch `Approval` / `ApprovalForAll` where the agent is **owner** or **spender**; emit `unexpected_approval` (machine codes, not a Revoke.cash product).

- **Priced-with:** minimal `recv-permit2-watch` stub (Approval-blind Permit2 slot awareness)
- Optional **revoke-intent emitter** stub that **NEVER signs**
- Pairs with `send-approve-bound` (prevent issuing vs detect already issued)

## Compose slot

```
recv-ingest → … → recv-approval-watch → recv-permit2-watch(stub) → recv-revoke-intent?(emit only) → recv-quarantine → recv-sweep-brake → …
```

`recv-sweep-brake` is mentioned as downstream compose only (slot 5 held — not built here). Does not replace at-send approve/Permit2 bounds.

## In scope (P0)

- Classify Approval / ApprovalForAll involving agent address as owner or spender
- Emit `unexpected_approval` (and related codes) against allow/expect policy
- Expected allowlist must not swallow unlimited / ApprovalForAll(true) without explicit opt-in
- `clearanceFromWatch` compose helper: degraded watch → fail-closed spend clearance
- Minimal Permit2-watch stub (local pin / sealed fixture path)
- Optional revoke-intent **payload emitter** — never holds keys, never broadcasts revoke
- Topic0 pins + offline fixtures; no live indexer hard dependency
- offline `demo:offline` + unit tests
- MIT, self-hosted; public GitHub OK; not on npm until founder

## Out of scope / fences

| Fence | Meaning |
| --- | --- |
| **Never auto-sign / auto-revoke** | Emitter only. Signing stays operator / wallet. |
| **No custody** | Observe + classify + emit. No key hosting. |
| **No Soft\*** | Forbidden. |
| **No Polar / checkout URLs** | None. |
| **No npm / Polar until founder** | Public GitHub OK. No `npm publish`, no Polar/checkout until LaunchGate + founder GO. |
| **No Revoke.cash / dashboard clone** | Machine codes + hooks, not a portfolio UX. |
| **No Safe / SaaS / mainnet SLA** | Charter out. |
| **LaunchGate-before-expansion** | Live indexer adapters, pager SKUs, auto-revoke need LaunchGate (auto-revoke stays culled). |
| **No recv-sweep-brake here** | Slot 5 held; compose mention only. |
| **Emit-only vs quarantine** | This package does not write quarantine state; compose owns FC wiring. |

## Fail modes (default)

| Case | Default | Notes |
| --- | --- | --- |
| Unexpected Approval (owner or spender) | emit `unexpected_approval` | FC on clearance if wired to quarantine |
| Unlimited / ApprovalForAll(true) on expected set | hit unexpected (unless opt-in) | allowlist must not swallow |
| ApprovalForAll(false) clear | `expected_ok` | unless `alertOnApprovalForAllClear` |
| Required watch/store degraded | **fail-closed** on spend clearance | degraded watch ≠ silent clear |
| Revoke-intent path | emit only | never sign |

## Soft* ban

Forbidden: any Soft* monetization / conversion naming or copy in this package (including hyphenated or spaced Soft* WTP forms). Use Soft* only as the ban token.

## Acceptance sketch (tandem)

Unexpected Approval (agent owner) → `unexpected_approval` code; no auto-revoke. Pairs with `send-approve-bound` (prevent vs detect).
