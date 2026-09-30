export { PACKAGE_VERSION } from "./version.js";
export {
  defaultApprovalWatchPolicy,
  UNLIMITED_ALLOWANCE,
  type ApprovalEvent,
  type ApprovalRole,
  type ApprovalWatchCode,
  type ApprovalWatchPolicy,
  type ApprovalWatchResult,
  type ClearanceDecision,
  type ClearanceFromWatchInput,
  type ClearanceFromWatchResult,
  type RevokeIntent,
} from "./types.js";
export { evaluateApprovalWatch } from "./evaluate.js";
export { emitRevokeIntent } from "./revokeIntent.js";
export { clearanceFromWatch } from "./clearance.js";
export {
  TOPIC0_APPROVAL,
  TOPIC0_APPROVAL_FOR_ALL,
} from "./topics.js";
