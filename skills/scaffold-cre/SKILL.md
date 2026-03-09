---
name: scaffold-cre
description: "Design, validate, and export Chainlink CRE workflows using Scaffold CRE. Use when creating triggers/capabilities, preparing export-ready projects, and checking CRE run instructions."
---

# Scaffold CRE Skill

Use this skill for work related to the **Scaffold CRE** project:
- Repo: https://github.com/tigeragentt/scaffold-cre
- Live UI: https://scaffold-cre.vercel.app/

## When to Use

✅ Use this skill when the user asks to:

- Build or modify workflow graph features (triggers, capabilities, linking)
- Improve TS export structure and generated files
- Update generated README/setup commands
- Fix workflow JSON import/export compatibility
- Adjust UI/UX in builder (panels, modals, theme, node spacing, naming)
- Prepare hackathon/demo-ready output from Scaffold CRE

## Project Scope

Scaffold CRE is the **main project**.  
Generated repos (example: `cre-register`) are outputs/artifacts from Scaffold CRE.

## Core Conventions

### 1) Workflow naming
- Exported workflow folder must be: `workflow-<slug>`
- ZIP file name should remain: `CRE-<slug>.zip`
- JSON export file name should be: `CRE-<name>.json`

### 2) Exported TS project structure (CRE-style)
Export should generate full project shape:

- `project.yaml`
- `secrets.yaml`
- `.env`
- `.cre/template.yaml`
- `.gitignore`
- `README.md`
- `workflow-<slug>/`
  - `main.ts`
  - `workflow.ts`
  - `workflow.yaml`
  - `package.json`
  - `tsconfig.json`
  - `config/config.staging.json`
  - `config/config.production.json`

### 3) README output rules
- Commands should run from **project root** (no `cd workflow-folder` instructions)
- Install with:
  - `bun install --cwd ./workflow-<slug>`
- Simulate with:
  - `cre workflow simulate workflow-<slug> --target=staging-settings`
- Broadcast example:
  - `cre workflow simulate workflow-<slug> --target=staging-settings --broadcast`

### 4) EVM generation rules
- Reuse `evmClient` (do not create multiple clients per handler)
- If smart contract name/address is defined, use that mapped address in config
- Do **not** require `consumerAddress` as a separate config key
- For finalized reads, use SDK constant `LAST_FINALIZED_BLOCK_NUMBER`
- For latest reads, omit `blockNumber`

### 5) Local Execution node rules
- Treated as callback capability (attach like other capabilities)
- Must support editable **Logic / Behavior** in left panel
- TS export should generate explicit function stubs + TODOs

### 6) Smart Contract node rules
- ABI field is removed from UI and types
- Generator should use placeholder ABI signatures (`parseAbi(...)`) with TODOs

## Validation Checklist Before Commit

- `npm run build` succeeds
- No TypeScript unused-variable errors
- JSON import works with all current node kinds (including local execution)
- UI still supports dark mode select/dropdown readability
- Export modal behavior:
  - Download closes modal
  - Secondary button label is `Cancel`
- Button ordering in header:
  - `Import JSON` appears first

## Commit Style

Prefer focused commit messages, e.g.:
- `feat: add local execution capability and TS stubs`
- `fix: use smart contract address for EVM write receiver`
- `fix: include LAST_FINALIZED_BLOCK_NUMBER import for EVM reads`
- `chore: update export README root-level run commands`

## Hackathon Submission Notes

For submission text:
- Project title: **Scaffold CRE**
- Main repo: `scaffold-cre`
- Generated example repo can be included as artifact/proof
- Ensure evidence includes on-chain tx hash and testnet explorer link
