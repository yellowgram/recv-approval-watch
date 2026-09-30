# IMPLEMENT_NOTES — recv-approval-watch P0

**As of:** 2026-09-30 (ET)  
**Against:** `/workspace/recv-approval-watch-lg/DESIGN-GATE.md` PASS-with-conditions (DC1–DC19)  
**Artifact:** `/workspace/recv-approval-watch` (still `"private": true`; public GitHub OK; no npm publish)

## What changed vs scaffold

| Area | Scaffold | P0 implement |
| --- | --- | --- |
| Evaluate expect path | Expected counterparty → `expected_ok` with no value / AFA check | Unlimited (`2^256-1`) and `ApprovalForAll(true)` stay `hit` unless opt-in flags (DC8) |
| ApprovalForAll clear | Alerted as unexpected if not expected | Default `expected_ok`; `alertOnApprovalForAllClear` opt-in (DC9) |
| Clearance | Absent | `clearanceFromWatch` — unhealthy → deny `approval_watch_degraded`; `degradeOpen` opt-in + stderr (DC4/DC5) |
| Codes | 5 codes | Closed set + `approval_watch_degraded` (DC16) |
| Topics | None | `TOPIC0_APPROVAL` / `TOPIC0_APPROVAL_FOR_ALL` pins (DC7/DC15) |
| Docs | Scaffold codes table | Verbatim honesty lines DC1/DC2/DC4/DC8/DC10/DC11/DC13 in README (+ DC1/DC4 in SECURITY) |
| Compose | Quarantine FC mentioned | Emit-only locked; sweep-brake downstream mention only (DC13/DC19); no quarantine mutation |
| package.json | private | Still private; homepage/OSS URLs present; `files[]` includes CHANGELOG + docs/DEMO.md; no npm publish |
| Demo | 6 fixture steps | + unlimited, AFA-true-on-expected, AFA-clear, clearance degraded/healthy |

## DC checklist

| ID | Status | Notes |
| --- | --- | --- |
| DC1 | satisfied | `emitRevokeIntent` always `signed: false`; no key/wallet/send APIs; verbatim README + SECURITY |
| DC2 | satisfied | No broadcast/txHash on intent; verbatim emit≠broadcast line in README |
| DC3 | satisfied | Observe + classify + emit only; SECURITY states no custody/KMS |
| DC4 | satisfied | `clearanceFromWatch`; unhealthy → deny `approval_watch_degraded`; verbatim README + SECURITY |
| DC5 | satisfied | `degradeOpen` default off; when armed prints stderr containing `approval_watch_degraded` |
| DC6 | satisfied | Owner + spender classify; demo step 4 + tests keep agent-as-spender |
| DC7 | satisfied | Approval + ApprovalForAll required; topic0 pins in README + `topics.ts` |
| DC8 | satisfied | Unlimited / AFA(true) not swallowed; opt-in flags default false; verbatim README |
| DC9 | satisfied | `approved === false` → `expected_ok` unless `alertOnApprovalForAllClear` |
| DC10 | satisfied (narrowed) | Permit2-watch out of P0 defaults (`permit2WatchStub` false); not exported as lead product; honesty line updated |
| DC11 | satisfied | Offline classify + fixtures; verbatim live-indexer line in README; no Alchemy/Graph dep |
| DC12 | satisfied | Machine codes + hooks only; no dashboard/SKU |
| DC13 | satisfied | Emit-only; verbatim quarantine-compose line in README; no quarantine writes |
| DC14 | satisfied | `defaultApprovalWatchPolicy().enabled === true`; disabled documented as non-classifying |
| DC15 | satisfied | Ingest contract in README; topic constants exported |
| DC16 | satisfied | Closed codes: unexpected_approval, unexpected_approval_for_all, permit2_slot_unexpected, revoke_intent_emitted, expected_ok, approval_watch_degraded |
| DC17 | satisfied | Tests cover DC8 unlimited, DC8 AFA, DC9 clear, DC6 spender, DC4 clearance, DC1 signed=false, README verbatim lines, demo sealed |
| DC18 | satisfied | No auto-revoke/custody/Polar/public URLs/Soft\* conversion/Safe SaaS/live indexer/sweep-brake impl; private:true; Soft\* ban token only |
| DC19 | satisfied | README compose: tandem send-approve-bound; sweep-brake downstream mention only |

## Rejected (not shipped)

R1–R16 from DESIGN-GATE remain rejected: no auto-sign/auto-revoke, no custody, no silent clear, no Revoke.cash clone, no full Permit2 claim, no live indexer P0, no public remote/npm/Polar, no send-approve-bound redesign, no recv-sweep-brake implementation, no unlimited-swallow ship, no treat emit as broadcast, no owner-only, no drop ApprovalForAll, no quarantine mutation inside evaluate, no Soft\* conversion naming, no enabled:false as default safe path.

## Soft* scan

Ban-token-only Soft\* mentions in CHARTER / README / demo / fixture / IMPLEMENT_NOTES (fence language). Banned Soft* conversion / monetization naming forms are absent from the tree (excluding node_modules/dist).

## Verification (this implement)

- `npm test` — **26 passed** (1 file: evaluate.test.ts — evaluate, clearance, topics, docs honesty, package fences)
- `npm run demo:offline` — OK, matches `docs/fixtures/offline.expected.txt` (11 fixture steps + charter/compose lines)

## DC still open

None of DC1–DC19 are left intentionally open for this P0. Expansion (live indexer adapters, pager SKUs) remains LaunchGate-gated; auto-revoke stays culled. Slot 5 `recv-sweep-brake` remains held (compose mention only).

## DHH close (2026-09-30)

Narrowed one-job export story to Approval/ApprovalForAll classify + codes + `clearanceFromWatch` fail-closed. Kept revoke-intent as unsigned emit (charter-core; never signs). Demoted Permit2-watch: `permit2WatchStub` defaults **false**, removed `TOPIC0_PERMIT2_APPROVAL_STUB` from public `api.ts` exports, README lead no longer sells a Permit2 stub product. Packaging: `CHANGELOG.md` + `docs/DEMO.md` in `files[]`. Soft\* ban-token only. Still **not** ready-for-npm (LaunchGate + founder GO out of this audit).
