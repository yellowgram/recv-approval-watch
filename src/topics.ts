/**
 * Pinned event topic0 values (keccak of canonical signatures).
 * Callers must supply correctly decoded events (or filter logs by these topics).
 * Omitting ApprovalForAll in the caller feed is an operator misconfig, not silent safety (DC7/DC15).
 */

/** Approval(address,address,uint256) */
export const TOPIC0_APPROVAL =
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

/** ApprovalForAll(address,address,bool) */
export const TOPIC0_APPROVAL_FOR_ALL =
  "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";

/**
 * Out of P0 / not exported from public API.
 * Opt-in callers who set permit2WatchStub may filter by this topic0 reference;
 * this package does not claim finished Permit2-watch coverage.
 */
export const TOPIC0_PERMIT2_APPROVAL_STUB =
  "0xda9fa7c1b00402c17d0161b249b1ab8bbec047c5a52207b9c112deffd817036b";
