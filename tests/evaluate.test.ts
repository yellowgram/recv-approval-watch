import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultApprovalWatchPolicy,
  evaluateApprovalWatch,
  emitRevokeIntent,
  clearanceFromWatch,
  UNLIMITED_ALLOWANCE,
  TOPIC0_APPROVAL,
  TOPIC0_APPROVAL_FOR_ALL,
  PACKAGE_VERSION,
} from "../src/api.js";

const AGENT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SPENDER_OK = "0x1111111111111111111111111111111111111111";
const SPENDER_BAD = "0x2222222222222222222222222222222222222222";
const OWNER_OTHER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function policy() {
  const p = defaultApprovalWatchPolicy();
  p.agentAddresses = new Set([AGENT]);
  p.expectedSpendersWhenOwner = new Set([SPENDER_OK]);
  p.expectedOwnersWhenSpender = new Set();
  p.permit2WatchStub = true;
  return p;
}

describe("evaluateApprovalWatch", () => {
  it("unexpected Approval as owner", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_BAD,
      value: 1n,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval");
    expect(r.role).toBe("owner");
  });

  it("expected spender when owner → ok (finite value)", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_OK,
      value: 1n,
    });
    expect(r.hit).toBe(false);
    expect(r.code).toBe("expected_ok");
  });

  it("ApprovalForAll as owner → unexpected_approval_for_all", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "ApprovalForAll",
      owner: AGENT,
      spender: SPENDER_BAD,
      approved: true,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval_for_all");
  });

  it("agent as spender inbound grant → unexpected_approval", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: OWNER_OTHER,
      spender: AGENT,
      value: 99n,
    });
    expect(r.hit).toBe(true);
    expect(r.role).toBe("spender");
    expect(r.code).toBe("unexpected_approval");
  });

  it("unrelated parties → no hit", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: OWNER_OTHER,
      spender: SPENDER_BAD,
      value: 1n,
    });
    expect(r.hit).toBe(false);
  });

  it("permit2 stub watch", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Permit2Allowance",
      owner: AGENT,
      spender: SPENDER_BAD,
      token: "0xcccccccccccccccccccccccccccccccccccccccc",
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("permit2_slot_unexpected");
  });

  it("revoke intent never signs", () => {
    const intent = emitRevokeIntent({
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_BAD,
      token: "0xcccccccccccccccccccccccccccccccccccccccc",
    });
    expect(intent.signed).toBe(false);
    expect(intent.code).toBe("revoke_intent_emitted");
    expect(intent.kind).toBe("erc20_approve_zero");
    // No broadcast / tx hash field on intent
    expect("txHash" in intent).toBe(false);
    expect("broadcast" in intent).toBe(false);
  });

  it("disabled → no hit", () => {
    const p = policy();
    p.enabled = false;
    const r = evaluateApprovalWatch(p, {
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_BAD,
    });
    expect(r.hit).toBe(false);
  });

  it("default policy enabled === true", () => {
    expect(defaultApprovalWatchPolicy().enabled).toBe(true);
  });

  // DC8: expected spender + unlimited → hit unexpected
  it("expected spender + unlimited value → unexpected_approval", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_OK,
      value: UNLIMITED_ALLOWANCE,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval");
    expect(r.role).toBe("owner");
  });

  // DC8: expected operator + ApprovalForAll(true) → hit
  it("expected operator + ApprovalForAll(true) → unexpected_approval_for_all", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "ApprovalForAll",
      owner: AGENT,
      spender: SPENDER_OK,
      approved: true,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval_for_all");
  });

  // DC8 opt-in for unlimited
  it("allowUnlimitedWhenExpected opt-in → expected_ok for unlimited", () => {
    const p = policy();
    p.allowUnlimitedWhenExpected = true;
    const r = evaluateApprovalWatch(p, {
      kind: "Approval",
      owner: AGENT,
      spender: SPENDER_OK,
      value: UNLIMITED_ALLOWANCE,
    });
    expect(r.hit).toBe(false);
    expect(r.code).toBe("expected_ok");
  });

  // DC8 opt-in for ApprovalForAll
  it("allowApprovalForAllWhenExpected opt-in → expected_ok", () => {
    const p = policy();
    p.allowApprovalForAllWhenExpected = true;
    const r = evaluateApprovalWatch(p, {
      kind: "ApprovalForAll",
      owner: AGENT,
      spender: SPENDER_OK,
      approved: true,
    });
    expect(r.hit).toBe(false);
    expect(r.code).toBe("expected_ok");
  });

  // DC9: ApprovalForAll(false) → expected_ok by default
  it("ApprovalForAll(false) → expected_ok by default", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "ApprovalForAll",
      owner: AGENT,
      spender: SPENDER_BAD,
      approved: false,
    });
    expect(r.hit).toBe(false);
    expect(r.code).toBe("expected_ok");
  });

  it("ApprovalForAll(false) with alertOnApprovalForAllClear → hit", () => {
    const p = policy();
    p.alertOnApprovalForAllClear = true;
    const r = evaluateApprovalWatch(p, {
      kind: "ApprovalForAll",
      owner: AGENT,
      spender: SPENDER_BAD,
      approved: false,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval_for_all");
  });

  // DC6: agent as spender still hits (also covered above; keep explicit)
  it("agent as spender still hits (DC6)", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Approval",
      owner: OWNER_OTHER,
      spender: AGENT,
      value: 1n,
    });
    expect(r.hit).toBe(true);
    expect(r.role).toBe("spender");
    expect(r.code).toBe("unexpected_approval");
  });

  // Spender-side expected owner + unlimited still hits
  it("expected owner when spender + unlimited → unexpected", () => {
    const p = policy();
    p.expectedOwnersWhenSpender = new Set([OWNER_OTHER]);
    const r = evaluateApprovalWatch(p, {
      kind: "Approval",
      owner: OWNER_OTHER,
      spender: AGENT,
      value: UNLIMITED_ALLOWANCE,
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("unexpected_approval");
    expect(r.role).toBe("spender");
  });
});

describe("clearanceFromWatch (DC4/DC5)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("watchHealthy true → allow expected_ok", () => {
    const r = clearanceFromWatch({ watchHealthy: true });
    expect(r.decision).toBe("allow");
    expect(r.code).toBe("expected_ok");
  });

  it("watchHealthy false → deny approval_watch_degraded (fail-closed)", () => {
    const r = clearanceFromWatch({ watchHealthy: false });
    expect(r.decision).toBe("deny");
    expect(r.code).toBe("approval_watch_degraded");
  });

  it("degradeOpen armed → allow with stderr approval_watch_degraded", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = clearanceFromWatch({ watchHealthy: false, degradeOpen: true });
    expect(r.decision).toBe("allow");
    expect(r.code).toBe("approval_watch_degraded");
    expect(err).toHaveBeenCalled();
    const joined = err.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("approval_watch_degraded");
  });

  it("degradeOpen default off — no silent clear", () => {
    const r = clearanceFromWatch({ watchHealthy: false });
    expect(r.decision).toBe("deny");
  });
});

describe("topics / ingest (DC7/DC15)", () => {
  it("TOPIC0_APPROVAL pin", () => {
    expect(TOPIC0_APPROVAL).toBe(
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
    );
  });

  it("TOPIC0_APPROVAL_FOR_ALL pin", () => {
    expect(TOPIC0_APPROVAL_FOR_ALL).toBe(
      "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"
    );
  });
});

describe("docs honesty lines (DC1/DC2/DC4/DC8/DC10/DC11/DC13)", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const security = readFileSync(join(root, "SECURITY.md"), "utf8");

  it("README verbatim honesty lines", () => {
    expect(readme).toContain(
      "This package never signs and never auto-revokes. Revoke-intent is an unsigned payload for the operator or wallet."
    );
    expect(readme).toContain(
      "revoke_intent_emitted is not proof a revoke was broadcast or mined."
    );
    expect(readme).toContain(
      "Degraded approval watch does not silently clear spend. Clearance is fail-closed while the watch is unhealthy."
    );
    expect(readme).toContain(
      "An expected spender does not allow unlimited ERC-20 allowance or ApprovalForAll(true). Those stay unexpected unless an explicit opt-in flag is set (default off)."
    );
    expect(readme).toContain(
      "The Permit2 path is a minimal stub. ERC-20 Approval watch is Approval-blind to Permit2 standing allowances; full Permit2 watch is priced-with / later, not claimed here."
    );
    expect(readme).toContain(
      "P0 is offline classify + fixtures. Live indexer adapters need a later LaunchGate."
    );
    expect(readme).toContain(
      "recv-approval-watch is emit-only. Quarantine and spend-clearance fail-closed wiring live in compose (with DC4 helper), not as hidden side effects inside evaluate."
    );
  });

  it("SECURITY verbatim DC1 and DC4 lines", () => {
    expect(security).toContain(
      "This package never signs and never auto-revokes. Revoke-intent is an unsigned payload for the operator or wallet."
    );
    expect(security).toContain(
      "Degraded approval watch does not silently clear spend. Clearance is fail-closed while the watch is unhealthy."
    );
  });

  it("package private fences", () => {
    const pkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8")
    ) as Record<string, unknown>;
    expect(pkg.private).toBe(true);
    expect(pkg.repository).toBeUndefined();
    expect(pkg.homepage).toBeUndefined();
    expect(pkg.prepublishOnly).toBeUndefined();
    expect(PACKAGE_VERSION).toBe("0.1.0");
  });
});
