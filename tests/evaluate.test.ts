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

  it("Permit2Allowance ignored by default", () => {
    const r = evaluateApprovalWatch(policy(), {
      kind: "Permit2Allowance",
      owner: AGENT,
      spender: SPENDER_BAD,
      token: "0xcccccccccccccccccccccccccccccccccccccccc",
    });
    expect(r.hit).toBe(false);
    expect(r.code).toBe("expected_ok");
  });

  it("permit2WatchStub opt-in → permit2_slot_unexpected", () => {
    const p = policy();
    p.permit2WatchStub = true;
    const r = evaluateApprovalWatch(p, {
      kind: "Permit2Allowance",
      owner: AGENT,
      spender: SPENDER_BAD,
      token: "0xcccccccccccccccccccccccccccccccccccccccc",
    });
    expect(r.hit).toBe(true);
    expect(r.code).toBe("permit2_slot_unexpected");
  });

  it("default policy permit2WatchStub === false", () => {
    expect(defaultApprovalWatchPolicy().permit2WatchStub).toBe(false);
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

  // expected spender + unlimited → hit unexpected
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

  // expected operator + ApprovalForAll(true) → hit
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

  //  opt-in for unlimited
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

  //  opt-in for ApprovalForAll
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

  // ApprovalForAll(false) → expected_ok by default
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

  // agent as spender still hits (also covered above; keep explicit)
  it("agent as spender still hits", () => {
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

describe("clearanceFromWatch", () => {
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

describe("topics / ingest", () => {
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

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("deprecation", () => {
  it("README says the package is deprecated and points to l2-send-guard", () => {
    const text = readFileSync(join(root, "README.md"), "utf8");
    expect(text).toContain("(deprecated)");
    expect(text).toContain("l2-send-guard");
  });
  it("version is 0.2.0 in package.json and PACKAGE_VERSION", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    expect(pkg.version).toBe("0.2.0");
    expect(PACKAGE_VERSION).toBe("0.2.0");
  });
});
