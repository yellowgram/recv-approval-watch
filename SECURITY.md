# Security

recv-approval-watch classifies Approval / ApprovalForAll involving an agent address and may emit revoke-intent payloads. It never signs, never broadcasts revokes, and does not custody keys. Not a hosted service or mainnet SLA.

This package never signs and never auto-revokes. Revoke-intent is an unsigned payload for the operator or wallet.

Degraded approval watch does not silently clear spend. Clearance is fail-closed while the watch is unhealthy.

Observe + classify + emit only. No key hosting, seed handling, or KMS integration. No Auto-Revoking / ERC-7715 executor. No portfolio dashboard.

Do not file public issues with private keys or funded transactions.
