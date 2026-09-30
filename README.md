# recv-approval-watch

**Status:** private LOCAL_SCAFFOLD · LaunchGate-before-expansion · not published

Watch `Approval` / `ApprovalForAll` where the agent is **owner** or **spender**; emit `unexpected_approval`. Priced-with: minimal Permit2-watch stub. Optional revoke-intent emitter that **NEVER signs**.

> **Charter:** [CHARTER.md](./CHARTER.md) — no Soft\* · no Polar/checkout · no custody · no public/npm until founder

```bash
npm install && npm test && npm run demo:offline
```

## Honesty (locked)

This package never signs and never auto-revokes. Revoke-intent is an unsigned payload for the operator or wallet.

revoke_intent_emitted is not proof a revoke was broadcast or mined.

Degraded approval watch does not silently clear spend. Clearance is fail-closed while the watch is unhealthy.

An expected spender does not allow unlimited ERC-20 allowance or ApprovalForAll(true). Those stay unexpected unless an explicit opt-in flag is set (default off).

The Permit2 path is a minimal stub. ERC-20 Approval watch is Approval-blind to Permit2 standing allowances; full Permit2 watch is priced-with / later, not claimed here.

P0 is offline classify + fixtures. Live indexer adapters need a later LaunchGate.

recv-approval-watch is emit-only. Quarantine and spend-clearance fail-closed wiring live in compose (with DC4 helper), not as hidden side effects inside evaluate.

## Codes (P0)

Closed set:

| Code | Meaning |
| --- | --- |
| `unexpected_approval` | Approval involving agent outside expect policy (or unlimited on expected without opt-in) |
| `unexpected_approval_for_all` | ApprovalForAll(true) involving agent outside expect (or on expected without opt-in) |
| `permit2_slot_unexpected` | minimal permit2-watch stub hit |
| `revoke_intent_emitted` | intent payload produced (never signed; not broadcast proof) |
| `expected_ok` | no unexpected grant / clear / disabled / unrelated |
| `approval_watch_degraded` | watch/store unhealthy — fail-closed spend clearance (`clearanceFromWatch`) |

## Topic0 pins (ingest)

Callers must supply correctly decoded `Approval` / `ApprovalForAll` / stub Permit2 events (or filter by these topics). Omitting ApprovalForAll in the caller feed is an operator misconfig, not silent safety.

| Event | topic0 |
| --- | --- |
| `Approval(address,address,uint256)` | `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925` |
| `ApprovalForAll(address,address,bool)` | `0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31` |

Exported as `TOPIC0_APPROVAL` / `TOPIC0_APPROVAL_FOR_ALL`.

## Policy notes

- `defaultApprovalWatchPolicy().enabled === true`. When `enabled: false`, the gate does not classify — do not present disabled examples as a protected agent path.
- `ApprovalForAll(approved: false)` defaults to `expected_ok` (clear is not an unexpected grant). Set `alertOnApprovalForAllClear: true` to alert on clears.
- Opt-in only (default **false**): `allowUnlimitedWhenExpected`, `allowApprovalForAllWhenExpected`.
- Compose clearance: `clearanceFromWatch({ watchHealthy })` — deny with `approval_watch_degraded` when unhealthy. `degradeOpen: true` is opt-in and prints one stderr line containing `approval_watch_degraded`.

## Compose

Tandem with `send-approve-bound` (prevent issuing at send vs detect already-issued / inbound here). Do not merge packages.

```
recv-ingest → … → recv-approval-watch → recv-permit2-watch(stub) → recv-revoke-intent?(emit only) → recv-quarantine → recv-sweep-brake → …
```

`recv-sweep-brake` is downstream compose after quarantine (slot 5 held — not implemented in this package). Quarantine state lives in compose, not inside `evaluateApprovalWatch`.

## License

MIT — [LICENSE](./LICENSE).
