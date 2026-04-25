# Quickstart: Editable Marketing Pages

## Implementation Path

1. Add `marketing_page_content` migration with tenant/page uniqueness and RLS.
2. Add page content types, defaults, and validation schemas for `shell`, `home`, `menu`, `events`, `cart-service`, and `contact`.
3. Extend `SiteContentService` with typed page-content loaders and updaters.
4. Add admin GET/PATCH route for page content.
5. Add admin form pages/cards for shared shell, Home, Menu, Events, Cart Service, and Contact.
6. Refactor public pages and shared header/footer to consume editable content.
7. Audit existing Gallery and About editors for full visible copy/image coverage.

## Manual QA

1. Sign in as a tenant admin.
2. Open `/admin/site-content`.
3. Edit and save shared shell content.
4. Visit `/`, `/menu`, `/events`, `/cart-service`, `/gallery`, `/about`, and `/contact`; confirm shared header/footer/navigation content updates everywhere.
5. Edit Home page remaining content and confirm `/` changes without altering hero/pathway content.
6. Edit Menu page content and confirm `/menu` changes while menu items still render.
7. Edit Events page content and confirm `/events` changes while events still render.
8. Edit Cart Service content and confirm `/cart-service` changes.
9. Edit Contact page content and confirm `/contact` changes while quote submission still works.
10. Try invalid URL, blank required copy, and missing image alt text; confirm save is blocked and previous public content remains.

## Automated Checks

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```
