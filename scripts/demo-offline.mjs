import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultApprovalWatchPolicy,
  evaluateApprovalWatch,
  emitRevokeIntent,
  clearanceFromWatch,
  UNLIMITED_ALLOWANCE,
} from "../dist/api.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = join(root, "docs/fixtures/offline.expected.txt");
const AGENT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SPENDER_OK = "0x1111111111111111111111111111111111111111";
const SPENDER_BAD = "0x2222222222222222222222222222222222222222";
const OWNER_OTHER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const lines = [];
const out = (s) => {
  lines.push(s);
  process.stdout.write(s + "\n");
};

out("recv-approval-watch offline demo");
out("no keys · no signing · no auto-revoke · machine codes only");
out("");

const p = defaultApprovalWatchPolicy();
p.agentAddresses = new Set([AGENT]);
p.expectedSpendersWhenOwner = new Set([SPENDER_OK]);
p.permit2WatchStub = true;

const r1 = evaluateApprovalWatch(p, {
  kind: "Approval",
  owner: AGENT,
  spender: SPENDER_BAD,
  value: 1n,
});
out(`1 unexpected Approval (agent owner) → hit=${r1.hit} code=${r1.code}`);

const r2 = evaluateApprovalWatch(p, {
  kind: "Approval",
  owner: AGENT,
  spender: SPENDER_OK,
  value: 1n,
});
out(`2 expected spender → hit=${r2.hit} code=${r2.code}`);

const r3 = evaluateApprovalWatch(p, {
  kind: "ApprovalForAll",
  owner: AGENT,
  spender: SPENDER_BAD,
  approved: true,
});
out(`3 ApprovalForAll → hit=${r3.hit} code=${r3.code}`);

const r4 = evaluateApprovalWatch(p, {
  kind: "Approval",
  owner: OWNER_OTHER,
  spender: AGENT,
  value: 9n,
});
out(`4 agent as spender → hit=${r4.hit} code=${r4.code}`);

const r5 = evaluateApprovalWatch(p, {
  kind: "Permit2Allowance",
  owner: AGENT,
  spender: SPENDER_BAD,
});
out(`5 permit2 stub → hit=${r5.hit} code=${r5.code}`);

const intent = emitRevokeIntent({
  kind: "Approval",
  owner: AGENT,
  spender: SPENDER_BAD,
});
out(`6 revoke-intent → signed=${intent.signed} code=${intent.code}`);

const r7 = evaluateApprovalWatch(p, {
  kind: "Approval",
  owner: AGENT,
  spender: SPENDER_OK,
  value: UNLIMITED_ALLOWANCE,
});
out(`7 expected+unlimited → hit=${r7.hit} code=${r7.code}`);

const r8 = evaluateApprovalWatch(p, {
  kind: "ApprovalForAll",
  owner: AGENT,
  spender: SPENDER_OK,
  approved: true,
});
out(`8 expected+ApprovalForAll(true) → hit=${r8.hit} code=${r8.code}`);

const r9 = evaluateApprovalWatch(p, {
  kind: "ApprovalForAll",
  owner: AGENT,
  spender: SPENDER_BAD,
  approved: false,
});
out(`9 ApprovalForAll(false) clear → hit=${r9.hit} code=${r9.code}`);

const c10 = clearanceFromWatch({ watchHealthy: false });
out(`10 clearance degraded → decision=${c10.decision} code=${c10.code}`);

const c11 = clearanceFromWatch({ watchHealthy: true });
out(`11 clearance healthy → decision=${c11.decision} code=${c11.code}`);

out("");
out("charter: no Soft* · no Polar · no custody · LaunchGate-before-expansion");
out("compose: emit-only → quarantine/clearance FC external · sweep-brake downstream only");

const expected = readFileSync(EXPECTED, "utf8").replace(/\r\n/g, "\n").trimEnd();
const actual = lines.join("\n").trimEnd();
if (actual !== expected) {
  console.error("[demo-offline] DRIFT");
  console.error("--- expected ---\n" + expected);
  console.error("--- actual ---\n" + actual);
  process.exit(1);
}
console.error("[demo-offline] OK — matches offline.expected.txt");
