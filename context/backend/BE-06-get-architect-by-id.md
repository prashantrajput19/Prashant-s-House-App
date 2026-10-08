# BE-06 — `backend_testGetArchitectByIdWithRoleValidation`

**Status:** Failing · **Order:** 6 · **Depends on:** BE-05 (the row it reads)

## What the test does

`GET /api/architects/1`:

- **Admin token** → **200**, and the body must have `architectId == 1`,
  `name == "John Architects"`, `expertise == "Residential"`, `location == "Chennai"`,
  `status == "Active"` (i.e. exactly what BE-05 inserted).
- **User token** → **403 FORBIDDEN**.

## Why it fails today

No `GET /api/architects/{architectId}` endpoint.

## What to implement

1. **`ArchitectService.getArchitectById(Long)` → `Optional<Architect>`** (SRS return type) + `Impl`.
2. **`ArchitectController`** — `@GetMapping("/{architectId}")`, `@PathVariable Long architectId`.
   Return 200 with the architect, or 404 when absent (SRS; untested).
3. **Admin-only rule** on this exact path+method.

## Files

**Modify:** `controller/ArchitectController.java`, `service/ArchitectService.java` +
`ArchitectServiceImpl.java`, `config/SecurityConfig.java`

## Gotchas

- **This is the trap in the suite.** `GET /api/architects/{id}` is **Admin-only (403 for User)**,
  but `GET /api/architects` (BE-07) is **open to both (200 for User)**. A single
  `.requestMatchers(HttpMethod.GET, "/api/architects/**").hasRole("Admin")` rule will break BE-07,
  and a single `.permitAll()` on the collection path pattern will break this test.
  Order your matchers so the **more specific** `/api/architects/{id}` rule is declared **before**
  the broader one — Spring Security applies the first match.
  Note `/api/architects/**` also matches `/api/architects` in Ant matching; prefer
  `/api/architects/*` with an explicit separate rule for the bare collection path, and verify both.
- The test reads the body before the role check on the admin branch, so a 200 with a wrong-shaped
  body still fails — return the entity itself, unwrapped from the `Optional`.
- `architectId` is asserted with `.asLong()`; it must be present in the JSON (don't `@JsonIgnore` it).

## Out of scope

404 behaviour, the User-facing architect browse screen, delete.

## Done when

Admin GET by id → 200 with the five asserted fields; User GET by id → 403; **and BE-07 still passes.**
