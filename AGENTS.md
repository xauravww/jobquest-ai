# AGENTS.md

Read `PROJECT_RULES.md` and follow it for every change in this repo.

## Hard rules

- **Never run `npm run build`** unless the user explicitly asks for it. Use
  `npx tsc --noEmit` (and `npx eslint` on touched files) for verification.
