# Reviewed legacy bracket conversion

Updated 2026-11-14. This tool was prepared and tested. **No customer database was
connected or migrated by this work.** Conversion is a separately approved
operator action; a prepared command or green CI result is not rollout approval.

The previous migration scanned all tournaments, supplied a local database
fallback, manufactured missing fighter IDs and saved incomplete trees. It has
been replaced by a single-record, dry-run-first review tool.

## What can be converted

Only a complete JSON object string containing a strict current-format seeds and
rounds tree can be converted to structured BSON. The persisted roster must have
2–256 unique valid account IDs; every seed and every downstream participant and
winner must match the roster and single-elimination progression. Referenced
athletes and the organizer must exist. Identifier hexadecimal casing can be
canonicalized; no missing ID, seed, opponent, round, rationale or result is
invented. System databases, unknown/ambiguous versions, duplicate JSON keys,
oversized/deep payloads, display names, partial seeds-only/rounds-only arrays,
invalid status/results and events with divisions are rejected for manual review.

Historical accounts need not still be active athletes: a later role change does
not rewrite a genuine old registration. Their referenced identity must exist.
Completed events require a recorded final winner, while upcoming events cannot
contain contested results. This utility does not certify scoring or eligibility.

## Review and apply contracts

`MONGO_URI` has no default and must identify the reviewed database server. Every
invocation requires `--database`, `--tournament-id`, `--operator` and `--reason`.
An explicit database in the URI must match `--database`, and the actual connected
database is checked again before reading/writing. The CLI disables automatic
collection/index creation so a dry run does not perform incidental schema writes.
It reads native BSON rather than relying on Mongoose to cast a legacy string.

Example **dry-run template** (use an approved target; placeholders are not an
instruction to connect a production database):

```text
npm run brackets:review --workspace server -- --database REVIEWED_DATABASE --tournament-id REVIEWED_24_HEX_ID --operator REVIEWED_OPERATOR --reason "Approved review ticket and purpose"
```

The output includes the exact source SHA-256, previous version, candidate tree
and next version, with `applied:false`. Inspect the candidate against the source
export, actual roster, historical results and independent backup. Store review
artifacts with restricted access; do not include credentials or private personal
data in the operator/reason fields.

An approved apply invocation must additionally contain **all three**:

```text
--apply --expected-version REVIEWED_INTEGER_OR_missing --expected-sha256 REVIEWED_64_HEX_SHA256
```

The tool rereads and validates the source, roster and account references inside
a MongoDB transaction. The write compares the exact raw bracket, old version
(or its absence), roster, organizer, status and division field. It increments
the version and records an immutable-schema audit with operator/reason, source
and target hashes, versions and original raw bracket in the same transaction.
A stale source, failed comparison, missing transaction support or audit failure
does not report successful apply. The session always closes. A second apply
cannot silently remigrate an already structured record.

This is a restricted database audit trail, not a tamper-proof ledger. Restrict
write permissions, retain a separately reviewed backup, and review required
collections/indexes through the deployment process. No automated rollback,
collection deletion, bulk rewrite or forced reseeding is provided. A rollback
must separately review current version/state, source audit and compatibility;
never overwrite newly recorded tournament results with an old export.

## Verification boundaries

`server/test/bracket-migration.test.cjs` exercises strict input/target validation,
valid and rejected legacy representations, raw/version/roster CAS, revalidation,
dry-run non-mutation and transactional audit/error propagation with mocked DB
boundaries. `server/test/bracket-migration.integration.test.cjs` uses an isolated
loopback replica-set database to check dry-run non-mutation, persisted BSON IDs,
exact versions, stale review/reference rejection and actual rollback on audit
failure. It explicitly skips without `TEST_MONGO_URI`; local Windows Application
Control prevents running the MongoDB executable. Actual source data quality, a
production backup restore and approved production conversion remain unperformed.
CI's disposable MongoDB integration provides transaction evidence only when its
actual run has been observed.
