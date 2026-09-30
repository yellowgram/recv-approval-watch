export type ApprovalWatchCode =
  | "unexpected_approval"
  | "unexpected_approval_for_all"
  | "permit2_slot_unexpected"
  | "revoke_intent_emitted"
  | "expected_ok"
  | "approval_watch_degraded";

export type ApprovalRole = "owner" | "spender" | "none";

export interface ApprovalEvent {
  kind: "Approval" | "ApprovalForAll" | "Permit2Allowance";
  owner: string;
  spender: string;
  /** token or Permit2-tracked token */
  token?: string;
  value?: bigint;
  approved?: boolean;
}

export interface ApprovalWatchPolicy {
  enabled: boolean;
  /** Lowercased agent addresses to watch (as owner or spender). */
  agentAddresses: Set<string>;
  /** Expected spenders when agent is owner (lowercased). Empty = any spender unexpected. */
  expectedSpendersWhenOwner: Set<string>;
  /** Expected owners when agent is spender. Empty = any owner unexpected for inbound authority. */
  expectedOwnersWhenSpender: Set<string>;
  /** Minimal permit2-watch stub enabled. */
  permit2WatchStub: boolean;
  /**
   * Opt-in: allow unlimited ERC-20 value (2^256-1) when counterparty is on the expected set.
   * Default false — expected allowlist must not swallow unlimited (DC8).
   */
  allowUnlimitedWhenExpected: boolean;
  /**
   * Opt-in: allow ApprovalForAll(true) when operator is on the expected set.
   * Default false — expected allowlist must not swallow operator-wide grants (DC8).
   */
  allowApprovalForAllWhenExpected: boolean;
  /**
   * When true, ApprovalForAll(approved:false) still alerts. Default false:
   * clear events are expected_ok (DC9).
   */
  alertOnApprovalForAllClear: boolean;
}

export interface ApprovalWatchResult {
  hit: boolean;
  role: ApprovalRole;
  code: ApprovalWatchCode;
  reason?: string;
}

export interface RevokeIntent {
  /** Sealed intent payload for operator/wallet — NEVER signed by this package. */
  kind: "erc20_approve_zero" | "setApprovalForAll_false" | "permit2_lockdown_stub";
  owner: string;
  spender: string;
  token?: string;
  /** Explicit: this package does not sign. */
  signed: false;
  code: "revoke_intent_emitted";
}

/** Spend-clearance decision from watch health (compose helper, DC4). */
export type ClearanceDecision = "allow" | "deny";

export interface ClearanceFromWatchInput {
  /** Required: true only when watch/store/ingest is healthy. */
  watchHealthy: boolean;
  /**
   * Opt-in degrade-open (default false). When armed and watch is unhealthy,
   * prints one stderr line containing `approval_watch_degraded` and allows.
   * Default off = fail-closed (DC5).
   */
  degradeOpen?: boolean;
}

export interface ClearanceFromWatchResult {
  decision: ClearanceDecision;
  code: "expected_ok" | "approval_watch_degraded";
  reason?: string;
}

/** ERC-20 uint256 max — unlimited allowance sentinel (DC8). */
export const UNLIMITED_ALLOWANCE = (1n << 256n) - 1n;

export function defaultApprovalWatchPolicy(): ApprovalWatchPolicy {
  return {
    enabled: true,
    agentAddresses: new Set(),
    expectedSpendersWhenOwner: new Set(),
    expectedOwnersWhenSpender: new Set(),
    permit2WatchStub: true,
    allowUnlimitedWhenExpected: false,
    allowApprovalForAllWhenExpected: false,
    alertOnApprovalForAllClear: false,
  };
}
