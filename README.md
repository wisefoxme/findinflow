# findinflow

Read-only [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) plugin to find **field** and **sObject** usage in local Flow metadata (`*.flow-meta.xml`). No org connection is required.

- **Source:** [github.com/wisefoxme/findinflow](https://github.com/wisefoxme/findinflow)
- **npm:** [findinflow](https://www.npmjs.com/package/findinflow)

## Install

From npm (recommended on any machine with Salesforce CLI):

```bash
sf plugins install findinflow
```

Update later:

```bash
sf plugins update findinflow
```

Install a specific version:

```bash
sf plugins install findinflow@1.2.0
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
git clone https://github.com/wisefoxme/findinflow.git
cd findinflow
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

### Version bump guide (SemVer)

Use [Semantic Versioning](https://semver.org/) for each release:

- **patch** (`x.y.Z`): bug fixes or internal-only changes
- **minor** (`x.Y.0`): backward-compatible features or behavior improvements
- **major** (`X.0.0`): breaking CLI/behavior changes

When bumping, update `package.json` and any README version examples in the same change.  
For local bumps without creating tags automatically:

```bash
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

## Scan scope

By design, commands scan **only** `*.flow-meta.xml` files under `packageDirectories` in the DX project (see `sfdx-project.json`). They do **not** connect to an org or call the Tooling/Metadata API.

On each default project scan (not when `--flow` points at a single file), the CLI:

- Warns that results reflect **local metadata only**—flows that exist only in the org but were not retrieved are omitted.
- Warns when other flow files exist **outside** `packageDirectories` (for example under `unpackaged/`) so you know they were not scanned.

Retrieve flows into a package path (for example `force-app/main/default/flows/`), or pass `--flow` with a path to one `.flow-meta.xml` to analyze a file outside the default scope.

## Indexed Flow elements

- `start` — record-triggered object, entry filters, and `filterFormula`
- `assignments` / `assignmentItems`
- `recordCreates`, `recordUpdates`, `recordLookups`, `recordDeletes`
- `variables` (SObject `objectType`)
- `formulas` and `decisions`
- `actionCalls` (input/output parameters)
- `screens` (nested `objectFieldReference`, lookup `fieldApiName` / `objectApiName`)
- `subflows` (`inputAssignments`)
- `collectionProcessors` and `loops`
- `customErrors` (`fieldSelection` on record-triggered flows)

**Relationship inference** (no org describe): multi-segment `$Record` and resource paths index each hop. Lookup/create **element names** map to their `object` (including `storeOutputAutomatically`). Naming heuristics: segments without `__` advance to that standard object name, `Foo__r` relationships containing `__` become `Foo__c`, and `Foo__c` segments stay on the parent object. Polymorphic or misnamed relationships can make `--object` filters miss or mislabel hits.

**Still limited:** full formula AST, `recordRollbacks`, screen component bindings without SObject typing, and dynamic choice sets. Org-only flows stay out of scope until retrieved locally. No matches does not prove a field is unused.

## License

BSD-3-Clause. See [LICENSE.txt](LICENSE.txt).

## Agent skills

The [skills/findinflow-cli](skills/findinflow-cli/SKILL.md) skill teaches agents how to run and interpret this CLI in Salesforce DX projects.