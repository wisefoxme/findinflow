---
name: findinflow-cli
description: >-
  Use when the user or task needs to find where a Salesforce field or sObject is
  referenced in Flow metadata in the local DX repo—before deleting or changing a
  field, auditing record-triggered flows, tracing assignments, or answering
  "which flows use X". Runs the read-only `findinflow` sf plugin against
  `*.flow-meta.xml` on disk (no org deploy or Tooling API). Prefer `--json` for
  structured results. Install with `sf plugins install findinflow` if the command
  is missing.
license: BSD-3-Clause
---

# findinflow CLI

The **findinflow** Salesforce CLI plugin scans **local** Flow source (`**/*.flow-meta.xml`)
in the current Salesforce DX project. It does not modify metadata or connect to an org.

## Prerequisites

1. Resolve the DX project: `sfdx-project.json` in cwd or a parent, or pass `--project-dir`.
2. Salesforce CLI (`sf`) installed.
3. Plugin installed:

```bash
sf plugins install findinflow
```

If the user is developing the plugin from a clone, use `sf plugins link .` after `npm run build` in the repo.

## When to use which command

| Goal | Command |
|------|---------|
| Field read/write (assignments, DML, start filters, formulas, decisions) | `sf findinflow field` |
| sObject references (start object, record elements, SObject variables) | `sf findinflow object` |

## Flow scope (both commands)

| Flag | Use |
|------|-----|
| *(default)* | All flows under `packageDirectories` |
| `--flow <apiNameOrPath>` | One flow by API name or path to `.flow-meta.xml` |
| `--flow-regexp <regex>` | Subset by flow API name (filename without `.flow-meta.xml`) |
| `--project-dir <dir>` | DX root when cwd is not the project |

Do not pass both `--flow` and `--flow-regexp`.

## Field search

```bash
sf findinflow field --name FieldApiName
sf findinflow field --name DOB__c --object Account
sf findinflow field --name Status --flow-regexp 'Referral.*'
```

- **`--name` / `-n`** (required): field API name only (e.g. `PersonBirthdate`, `DOB__c`).
- **`--object`**: strongly recommended for ambiguous names (`Id`, `Name`, `Status`, `OwnerId`).

Results list **Usage** as `read` or `write`, plus **Flow**, **Node**, **NodeType**, and **Detail** (e.g. `filter`, `inputAssignment`, `assignToReference`, `formula.expression`).

## Object search

```bash
sf findinflow object --name Account
sf findinflow object --name Referral_Stage_History__c
```

**Usage** is `reference` for object hits.

## Agent workflow

1. `cd` to the DX project root (or set `--project-dir`).
2. Run with **`--json`** when you need to summarize or filter programmatically.
3. For field impact on a **specific object**, always pass **`--object`** when the field name is not unique across objects.
4. To narrow noise, use **`--flow-regexp`** or **`--flow`** after an initial broad search.
5. Interpret **write** hits before deleting or renaming fields; **read** hits for formulas, decisions, and filters.

Example:

```bash
sf findinflow field --name DOB__c --object Account --json
```

## Indexed Flow elements

`start` (including `filterFormula`), `assignments`, record DML elements, SObject `variables`,
`formulas`, `decisions`, `actionCalls`, `screens`, `subflows`, `collectionProcessors`, `loops`,
and `customErrors`.

Decision and collection **conditions** share one indexer (`leftValueReference` and
`rightValue/elementReference`). **Element context:** SObject `variables` plus `recordLookups` /
`recordCreates` names → `object`, so `Get_Account.Name` can match with `--object Account`.
**Relationship paths:** `$Record.Account.BillingState` indexes `Account` on the trigger object and
`BillingState` on `Account` via naming heuristics (`__r` / standard names)—not org describe.

**Still limited:** full formula AST, flows not in the local repo, screen picklist/component refs
without typing, and dynamic choice sets. Treat no matches as inconclusive for edge-heavy flows.

## Errors

| Situation | Action |
|-----------|--------|
| Command not found | `sf plugins install findinflow` |
| No flows found | Check `--project-dir`, retrieve flows into `force-app/.../flows/`, or relax filters |
| No matches | Try without `--object`, widen flow scope, or confirm API names from metadata |

## Related

- Plugin repo: https://github.com/wisefoxme/findinflow
- npm: `findinflow`