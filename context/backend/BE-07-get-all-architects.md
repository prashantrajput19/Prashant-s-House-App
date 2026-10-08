# BE-07 — `backend_testGetAllArchitects`

**Status:** Failing · **Order:** 7

## What the test does

`GET /api/architects` twice:

- **Admin token** → **200**, body `isArray()`.
- **User token** → **200**, body `isArray()`.

This is the **only** endpoint in the suite where both roles succeed.

## Why it fails today

No `GET /api/architects` endpoint.

## What to implement

1. **`ArchitectService.getAllArchitects()` → `List<Architect>`** + `Impl` (`repo.findAll()`).
2. **`ArchitectController`** — `@GetMapping` on the class-level `/api/architects` path,
   returning 200 with the list.
3. **Security rule:** authenticated, **any role**. Do not restrict to Admin.

## Files

**Modify:** `controller/ArchitectController.java`, `service/ArchitectService.java` +
`ArchitectServiceImpl.java`, `config/SecurityConfig.java`

## Gotchas

- **Must serialise as a JSON array.** `assertTrue(body.isArray())` fails if you wrap the list in an
  envelope like `{"data": [...]}` or `{"architects": [...]}`. Return the bare `List<Architect>`.
- An empty list `[]` would still pass both assertions — but by this point BE-05 has inserted a row,
  and `Architect` serialisation errors (e.g. a lazy-proxy or recursion problem) surface here first.
- **Read the matcher-ordering warning in BE-06.** These two tests pull in opposite directions on the
  same URL prefix and are the most likely pair to be mutually broken by a careless Ant pattern.
- SRS p.43 suggests `permitAll()` for this endpoint. Not needed — the test always sends a valid
  token. Keep it `authenticated()` so unauthenticated access is still rejected.

## Out of scope

Pagination, sorting, filtering by expertise/status/location, search.

## Done when

Both tokens get 200 and a top-level JSON array, **and BE-06 still returns 403 for the user token.**
