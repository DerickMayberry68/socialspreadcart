---
name: speckit
description: Run the GitHub Spec Kit workflow for spec-driven development in this repository. Use when the user asks for /speckit, Spec Kit, spec-first development, or wants to create, clarify, plan, task, analyze, or implement a feature through specs before code.
---

# Spec Kit Router

Use the repo's Spec Kit project structure in `.specify/` and the focused skills in `.agents/skills/speckit-*`.

## Choose the Phase

- New feature or content area: use `$speckit-specify`.
- Existing spec needs product answers: use `$speckit-clarify`.
- Spec is ready for design: use `$speckit-plan`.
- Plan is ready for task breakdown: use `$speckit-tasks`.
- Spec, plan, and tasks need a consistency pass: use `$speckit-analyze`.
- Tasks are approved and ready for code: use `$speckit-implement`.
- Project constitution changes: use `$speckit-constitution`.

If the user types `/speckit`, treat that as an intent to use this skill. Codex CLI custom slash commands are not repo-defined, so continue with the closest `$speckit-*` phase and tell the user which phase you selected.

## Default Workflow

1. Start with `$speckit-specify` for non-trivial feature work.
2. Run `$speckit-clarify` only when important ambiguity remains.
3. Run `$speckit-plan`.
4. Run `$speckit-tasks`.
5. Run `$speckit-analyze` when multiple artifacts changed or requirements are complex.
6. Run `$speckit-implement` after the artifacts are ready.

Keep `.specify/feature.json` aligned with the active feature directory before downstream phases.
