import type { ApprovalEvent, RevokeIntent } from "./types.js";

/**
 * Emit a revoke-intent payload for operator/wallet to sign.
 * NEVER signs. NEVER broadcasts. signed is always false.
 */
export function emitRevokeIntent(ev: ApprovalEvent): RevokeIntent {
  let kind: RevokeIntent["kind"] = "erc20_approve_zero";
  if (ev.kind === "ApprovalForAll") kind = "setApprovalForAll_false";
  if (ev.kind === "Permit2Allowance") kind = "permit2_lockdown_stub";
  return {
    kind,
    owner: ev.owner.toLowerCase(),
    spender: ev.spender.toLowerCase(),
    token: ev.token?.toLowerCase(),
    signed: false,
    code: "revoke_intent_emitted",
  };
}
