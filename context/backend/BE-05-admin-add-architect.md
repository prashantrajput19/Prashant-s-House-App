# BE-05 — `backend_testAdminAddArchitect`

**Status:** Failing · **Order:** 5 · **Depends on:** BE-03, BE-04 · **Blocks:** BE-06, BE-08, BE-09, BE-12, BE-13

## What the test does

Two calls to `POST /api/architects` with the same body:

```json
{ "architectId": 1, "name": "John Architects", "expertise": "Residential",
  "location": "Chennai", "rating": 4.5,
  "portfolioLink": "https://portfolio.com/john", "status": "Active" }
```

- **With admin token** → expects **201** and asserts the response JSON fields
  `name`, `expertise`, `location`, `status` echo the request.
- **With user token** → expects **403 FORBIDDEN**.

## Why it fails today

No `ArchitectController`, no `ArchitectService`, `Architect` is an empty class, `ArchitectRepo` is
an empty interface.

## What to implement

1. **`Architect` model** — Foundation F1. All seven fields, `architectId` identity-generated.
   The JSON property names must match the request exactly (`portfolioLink`, not `portfolio_link`).
2. **`ArchitectRepo extends JpaRepository<Architect, Long>`**.
3. **`ArchitectService.addArchitect(Architect)` → `Architect`** (SRS return type) + `Impl`.
4. **`ArchitectController`** — `@RestController @RequestMapping("/api/architects")`,
   `@PostMapping` returning **201** with the saved `Architect` as the body.
5. **Admin-only rule** on `POST /api/architects` — either
   `@PreAuthorize("hasRole('Admin')")` on the method (needs `@EnableMethodSecurity`) or
   `.requestMatchers(HttpMethod.POST, "/api/architects").hasRole("Admin")` in `SecurityConfig`.

## Files

**Create:** `controller/ArchitectController.java`, `service/ArchitectService.java`,
`service/ArchitectServiceImpl.java`
**Modify:** `model/Architect.java`, `repository/ArchitectRepo.java`, `config/SecurityConfig.java`

## Gotchas

- **The saved architect must get `architectId == 1`.** BE-06 and BE-08 fetch `/api/architects/1`
  and assert the id. Clean DB required.
- **The response body must be the saved entity**, not a success message or a bare 201. The four
  field assertions run against the body.
- **403, not 401.** The user token is valid; it is the *role* that is wrong. If your JWT filter
  fails to authenticate the request at all you will get 401 here and the test fails on the second
  half. Check the filter populates the `SecurityContext` before the authorization rule runs.
- Returning 200 instead of 201 is the other common miss.
- Do not add a duplicate-name check that throws `DuplicateArchitectException` — the same body is
  POSTed twice (once per role) and the second call must fail on *authorization*, before any
  business rule. Authorization runs first in the filter chain, so this is safe by default, but
  don't move the check earlier.

## Out of scope

`DELETE /api/architects/{id}`, the expertise/status/location/search finders, rating validation,
`DuplicateArchitectException` handling.

## Done when

Admin POST → 201 with the echoed body; User POST → 403.
