# BE-08 — `backend_testUpdateArchitectWithRoleValidation`

**Status:** Failing · **Order:** 8 · **Depends on:** BE-05

## What the test does

`PUT /api/architects/1` with:

```json
{ "architectId": 1, "name": "Updated Architects", "expertise": "Commercial",
  "location": "Bangalore", "rating": 4.8,
  "portfolioLink": "https://portfolio.com/updated", "status": "Active" }
```

- **Admin token** → **200**, body asserts `architectId == 1`, `name == "Updated Architects"`,
  `expertise == "Commercial"`, `location == "Bangalore"`, `status == "Active"`.
- **User token** → **403 FORBIDDEN**.

## Why it fails today

No `PUT /api/architects/{architectId}` endpoint.

## What to implement

1. **`ArchitectService.updateArchitect(Long architectId, Architect updatedArchitect)` → `Architect`**
   (SRS signature — id first, then the body) + `Impl`: load the existing row, copy the mutable
   fields across, save, return the saved entity.
2. **`ArchitectController`** — `@PutMapping("/{architectId}")`, returns 200 with the updated entity,
   404 if absent (SRS; untested).
3. **Admin-only rule** on `PUT /api/architects/*`.

## Files

**Modify:** `controller/ArchitectController.java`, `service/ArchitectService.java` +
`ArchitectServiceImpl.java`, `config/SecurityConfig.java`

## Gotchas

- **Update in place — do not insert a new row.** Load by `architectId` and mutate, or ensure the
  entity you save carries the existing id. Saving a detached entity with a null id creates
  architect #2 and silently leaves #1 stale; the response body might even look right while BE-09's
  inquiry (which references architect 1) then points at the old record.
- **The response must be the updated entity**, not the pre-update state and not a message.
- 403 for the User branch depends on the same working JWT filter as BE-05/BE-06.
- `rating` is a `Double` — `4.8` must bind. Don't type the field as `Integer`/`int`.

## Out of scope

Partial updates / PATCH semantics, optimistic locking, 404 handling, delete.

## Done when

Admin PUT → 200 with the four updated fields echoed; User PUT → 403; only one architect row exists.
