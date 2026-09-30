import type {
  ApprovalEvent,
  ApprovalWatchPolicy,
  ApprovalWatchResult,
  ApprovalRole,
} from "./types.js";
import { UNLIMITED_ALLOWANCE } from "./types.js";

function norm(a: string): string {
  return a.toLowerCase();
}

function roleFor(
  policy: ApprovalWatchPolicy,
  ev: ApprovalEvent
): ApprovalRole {
  const owner = norm(ev.owner);
  const spender = norm(ev.spender);
  const isOwner = policy.agentAddresses.has(owner);
  const isSpender = policy.agentAddresses.has(spender);
  if (isOwner) return "owner";
  if (isSpender) return "spender";
  return "none";
}

function isUnlimited(value: bigint | undefined): boolean {
  return value !== undefined && value === UNLIMITED_ALLOWANCE;
}

function counterpartyExpected(
  policy: ApprovalWatchPolicy,
  role: ApprovalRole,
  owner: string,
  spender: string
): boolean {
  if (role === "owner") {
    return (
      policy.expectedSpendersWhenOwner.size > 0 &&
      policy.expectedSpendersWhenOwner.has(spender)
    );
  }
  if (role === "spender") {
    return (
      policy.expectedOwnersWhenSpender.size > 0 &&
      policy.expectedOwnersWhenSpender.has(owner)
    );
  }
  return false;
}

/**
 * Classify Approval / ApprovalForAll involving agent (P0 one job).
 * Permit2Allowance only when policy.permit2WatchStub === true (opt-in; out of P0 defaults).
 * Emits machine codes — not a Revoke product.
 * Expected allowlist does not swallow unlimited or ApprovalForAll(true) unless opt-in (DC8).
 * ApprovalForAll(false) defaults to expected_ok (DC9).
 */
export function evaluateApprovalWatch(
  policy: ApprovalWatchPolicy,
  ev: ApprovalEvent
): ApprovalWatchResult {
  if (!policy.enabled) {
    return { hit: false, role: "none", code: "expected_ok" };
  }

  const role = roleFor(policy, ev);
  if (role === "none") {
    return { hit: false, role, code: "expected_ok" };
  }

  if (ev.kind === "Permit2Allowance") {
    if (!policy.permit2WatchStub) {
      return { hit: false, role, code: "expected_ok" };
    }
    return {
      hit: true,
      role,
      code: "permit2_slot_unexpected",
      reason: "Permit2 allowance slot involves agent (stub watch)",
    };
  }

  const owner = norm(ev.owner);
  const spender = norm(ev.spender);

  // DC9: ApprovalForAll clear (approved === false) is not an unexpected grant by default.
  if (ev.kind === "ApprovalForAll" && ev.approved === false) {
    if (policy.alertOnApprovalForAllClear === true) {
      return {
        hit: true,
        role,
        code: "unexpected_approval_for_all",
        reason: `ApprovalForAll clear alerted (alertOnApprovalForAllClear)`,
      };
    }
    return { hit: false, role, code: "expected_ok" };
  }

  const expected = counterpartyExpected(policy, role, owner, spender);

  // DC8: unlimited ERC-20 on expected set stays unexpected unless allowUnlimitedWhenExpected.
  if (
    ev.kind === "Approval" &&
    expected &&
    isUnlimited(ev.value) &&
    policy.allowUnlimitedWhenExpected !== true
  ) {
    return {
      hit: true,
      role,
      code: "unexpected_approval",
      reason:
        role === "owner"
          ? `agent owner ${owner} granted unlimited to expected spender ${spender}`
          : `agent spender ${spender} received unlimited from expected owner ${owner}`,
    };
  }

  // DC8: ApprovalForAll(true) on expected set stays unexpected unless allowApprovalForAllWhenExpected.
  if (
    ev.kind === "ApprovalForAll" &&
    ev.approved === true &&
    expected &&
    policy.allowApprovalForAllWhenExpected !== true
  ) {
    return {
      hit: true,
      role,
      code: "unexpected_approval_for_all",
      reason:
        role === "owner"
          ? `agent owner ${owner} set ApprovalForAll(true) for expected operator ${spender}`
          : `agent spender ${spender} received ApprovalForAll(true) from expected owner ${owner}`,
    };
  }

  if (expected) {
    return { hit: false, role, code: "expected_ok" };
  }

  const code =
    ev.kind === "ApprovalForAll"
      ? "unexpected_approval_for_all"
      : "unexpected_approval";
  return {
    hit: true,
    role,
    code,
    reason:
      role === "owner"
        ? `agent owner ${owner} granted unexpected spender ${spender}`
        : `agent spender ${spender} received unexpected grant from ${owner}`,
  };
}
