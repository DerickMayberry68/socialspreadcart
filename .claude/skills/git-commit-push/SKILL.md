---
name: "git-commit-push"
description: "Stage relevant changes, create a safe commit, and push to the tracked remote branch. Use when the user asks to commit and push, publish changes, or sync local git updates."
argument-hint: "Optional commit message or commit intent"
user-invocable: true
disable-model-invocation: true
---

# Commit And Push

Use this command to complete a full local-to-remote git flow safely.

## User Input

```text
$ARGUMENTS
```

If user input is provided, treat it as commit message guidance.

## Workflow

1. **Inspect repo state**
   - Run:
     - `git status --short`
     - `git diff --stat`
     - `git diff --cached --stat`
     - `git log -5 --oneline`
   - If there are no changes to commit, report and stop.

2. **Protect sensitive and generated files**
   - Do not commit files likely to contain secrets (for example: `.env`, `.env.local`, `.env.test`, key files, credential JSON files).
   - Do not commit transient build outputs (for example: `tsconfig.tsbuildinfo`) unless explicitly requested.
   - If only unsafe files are pending, report and stop.

3. **Prepare a commit message**
   - If `$ARGUMENTS` is non-empty, use it as the message basis.
   - Otherwise create a concise message from the staged diff that reflects intent (`add`, `update`, `fix`, `refactor`, `docs`, `test`).

4. **Commit**
   - Stage only relevant files.
   - Commit with a multi-line message format using a heredoc:
   - Example:
     - `git commit -m "$(cat <<'EOF'`
     - `Commit title`
     - ``
     - `Optional details`
     - `EOF`
     - `)"`

5. **Push**
   - Push to the current tracked remote branch with `git push`.
   - If branch has no upstream, use `git push -u origin HEAD`.

6. **Report**
   - Return:
     - commit hash
     - branch name
     - remote push result
     - any intentionally skipped files

## Guardrails

- Never run destructive git commands (`reset --hard`, force push) unless explicitly requested.
- Never modify global/local git config.
- Never include secrets by default.
