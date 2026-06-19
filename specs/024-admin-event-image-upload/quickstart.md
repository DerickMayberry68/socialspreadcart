# Quickstart: Admin Event Image Upload

## Preconditions

- App is running locally.
- Admin user is signed in.
- Active tenant is selected.
- Storage service role configuration is available.

## Manual Validation

1. Open `/admin/events`.
2. Click **New event**.
3. Fill title, date/time, location, and description.
4. Click the event image upload control and choose a valid image.
5. Confirm upload state appears while the file is uploading.
6. Confirm the image URL field is populated automatically.
7. Confirm an image preview appears.
8. Save the event.
9. Confirm the event appears in Scheduled events.
10. Edit the event.
11. Choose a different image.
12. Confirm the preview and URL update.
13. Save and confirm the event still retains the other event details.

## Failure Validation

1. Open `/admin/events`.
2. Start creating or editing an event.
3. Attempt to upload a non-image file.
4. Confirm a handled error appears and the image URL remains unchanged.
5. Simulate upload failure by disabling storage configuration or forcing the upload route to return an error.
6. Confirm the form keeps the previous image URL and does not save while upload is in progress.

## Automated Checks

Run:

```powershell
npx vitest run tests/components/admin/event-manager.test.tsx tests/api/admin-events-upload-route.test.ts
npx tsc --noEmit
npm run build
```
