# Spec 004 Quickstart

## Verification Commands

Run the full verification set after refactors:

```powershell
npx tsc --noEmit
npm test
```

## Supabase Audit

Spec 004 is not complete unless these searches stay clean:

```powershell
rg -n "@supabase/(ssr|supabase-js)" src --glob "!src/services/**" --glob "!src/lib/supabase/**"
rg -n "create(Client|ServerClient)|from\(" src/app src/components
```

Expected result:

- The import audit returns no matches outside `src/services/` and `src/lib/supabase/`.
- The direct-query audit returns no matches in `src/app/` or `src/components/`.
