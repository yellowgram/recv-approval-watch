import type {
  ClearanceFromWatchInput,
  ClearanceFromWatchResult,
} from "./types.js";

/**
 * Compose clearance helper (DC4/DC5).
 * When watchHealthy !== true, spend clearance is fail-closed with
 * `approval_watch_degraded` unless degradeOpen is explicitly armed (default off).
 * This package does not write quarantine state — compose wires FC (DC13).
 */
export function clearanceFromWatch(
  input: ClearanceFromWatchInput
): ClearanceFromWatchResult {
  if (input.watchHealthy === true) {
    return { decision: "allow", code: "expected_ok" };
  }

  const degradeOpen = input.degradeOpen === true;
  if (degradeOpen) {
    console.error(
      "approval_watch_degraded: degradeOpen armed — spend clearance allowed while watch unhealthy (opt-in; default is fail-closed)"
    );
    return {
      decision: "allow",
      code: "approval_watch_degraded",
      reason: "degradeOpen armed while watch unhealthy",
    };
  }

  return {
    decision: "deny",
    code: "approval_watch_degraded",
    reason: "watch/store/ingest unhealthy — fail-closed spend clearance",
  };
}
