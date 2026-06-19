# Research: Admin Event Image Upload

## D-001: Reuse Existing Public Image Storage Pattern

**Decision**: Upload event images to the existing public image storage bucket using a tenant-prefixed path.

**Rationale**: Menu item and site-content image uploads already use this storage model. Reusing it keeps tenant isolation and public URL behavior consistent across admin-managed public images.

**Alternatives considered**:
- Create a new bucket for events: rejected because the existing public image bucket already serves this content category and avoids extra storage configuration.
- Store event images as base64 or database blobs: rejected because the app already stores public image URLs and uses storage for binary assets.

## D-002: Dedicated Event Upload Endpoint

**Decision**: Add a dedicated admin Events image upload route instead of reusing the menu item upload route.

**Rationale**: Event images should have event-specific storage paths and error copy while keeping the endpoint contract narrow. This also avoids coupling future menu-item changes to events.

**Alternatives considered**:
- Reuse `/api/admin/menu-items/upload`: rejected because storage paths and user-facing copy would be misleading.
- Add a generic admin upload route now: rejected because that is broader than the requested Events fix and would require a larger authorization/content-type contract.

## D-003: Preserve Manual URL Entry

**Decision**: Keep the image URL input visible and editable while adding upload controls and preview.

**Rationale**: The existing editor already supports URL entry. Preserving it avoids breaking current workflows and allows externally hosted images when needed.

**Alternatives considered**:
- Replace the URL field with upload only: rejected because it removes an existing capability.
- Hide the URL field behind an advanced toggle: rejected because the current admin UI already exposes URL fields consistently elsewhere.

## D-004: No Media Library in This Feature

**Decision**: This feature uploads/selects from the admin's device only; browsing prior uploads is out of scope.

**Rationale**: The user asked for a way to select an image while creating an event. A media library would add indexing, deletion, reuse, and permission scope that are not needed for the immediate workflow.
