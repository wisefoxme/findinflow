# plugin-findinflow

Read-only [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) plugin to find **field** and **sObject** usage in local Flow metadata (`*.flow-meta.xml`). No org connection is required.

- **Source:** [github.com/wisefoxme/plugin-findinflow](https://github.com/wisefoxme/plugin-findinflow)
- **npm:** [plugin-findinflow](https://www.npmjs.com/package/plugin-findinflow)

## Install

From npm (recommended on any machine with Salesforce CLI):

```bash
sf plugins install plugin-findinflow
```

Update later:

```bash
sf plugins update plugin-findinflow
```

Install a specific version:

```bash
sf plugins install plugin-findinflow@1.0.0
```

Run from a Salesforce DX project directory (or pass `--project-dir`).

## Commands

### `sf findinflow field`

Find where a field is read or written.

| Flag | Description |
|------|-------------|
| `--name` / `-n` | Field API name (required) |
| `--object` | Limit to an sObject context (recommended for `Id`, `Name`, `Status`) |
| `--project-dir` | DX project root (default: cwd) |
| `--flow` | Single flow API name or path to one `.flow-meta.xml` |
| `--flow-regexp` | Regex on flow API names |

### `sf findinflow object`

Find where an sObject is referenced (record-triggered start, DML elements, SObject variables).

Same flow scope flags as above; `--name` / `-n` is the object API name.

## Examples

```bash
cd path/to/dx-project
sf findinflow field --name DOB__c --object Account
sf findinflow field --name Status --flow-regexp 'Referral.*'
sf findinflow object --name ActionPlan
sf findinflow object --name Referral_Stage_History__c --flow Referral_Stage_History
sf findinflow field --name DOB__c --object Account --json
```

## Development

```bash
git clone https://github.com/wisefoxme/plugin-findinflow.git
cd plugin-findinflow
npm install --ignore-scripts
npm run build
sf plugins link .
```

Without linking:

```bash
./bin/dev.js findinflow field --name DOB__c --object Account --project-dir /path/to/dx-project
```

```bash
npm test
```

Coverage threshold: 80% on `src/shared/`.

### Publish (maintainers)

```bash
npm run build
npm test
npm publish --access public
```

`prepack` runs `sf-prepack` so the tarball includes `lib/`, `oclif.manifest.json`, and messages.

## v1 coverage

Indexed element types:

- `start` (record-triggered object and entry filters)
- `assignments` / `assignmentItems`
- `recordCreates`, `recordUpdates`, `recordLookups`, `recordDeletes`
- `variables` (SObject `objectType`)
- `formulas` and `decisions` (field references in expressions and conditions)

Not yet indexed: `screens`, `actionCalls`, `subflows`, collection processors, and custom errors.

## License

Apache-2.0