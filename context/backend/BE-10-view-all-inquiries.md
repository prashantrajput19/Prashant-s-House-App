# BE-10 — `backend_testRoleBasedAccessForViewingAllInquiries`

**Status:** Failing · **Order:** 10 · **Depends on:** BE-09

## What the test does

`GET /api/inquiries`:

- **Admin token** → **200**, body `isArray()`.
- **User token** → **403 FORBIDDEN**.

## Why it fails today

No `GET /api/inquiries` endpoint.

## What to implement

1. **`ArchitectInquiryService.getAllInquiries()` → `List<ArchitectInquiry>`** + `Impl`.
2. **`ArchitectInquiryController`** — `@GetMapping` on the class path, 200 + bare list.
3. **Admin-only rule** on `GET /api/inquiries`.

## Files

**Modify:** `controller/ArchitectInquiryController.java`,
`service/ArchitectInquiryService.java` + `Impl`, `config/SecurityConfig.java`

## Gotchas

- **Same URL, different methods, different roles:** `POST /api/inquiries` is **User-only** (BE-09)
  while `GET /api/inquiries` is **Admin-only** (this test). Your security rules must be
  method-aware — `.requestMatchers("/api/inquiries").hasRole(...)` without an `HttpMethod` argument
  will break one of the two. Use `.requestMatchers(HttpMethod.GET, "/api/inquiries").hasRole("Admin")`
  and a separate POST rule, or `@PreAuthorize` per handler method.
- **Must be a bare JSON array** — no envelope (`assertTrue(isArray())`).
- This is the first endpoint that serialises a *list* of inquiries with their nested user and
  architect. If BE-09 left a transient/blank `User` attached, this is where the lazy-load or
  recursion error surfaces as a 500.
- Returning an empty array would still pass, so a green result here does not prove BE-09 persisted
  correctly — check the body contents manually once.

## Out of scope

Filtering by status/priority, pagination, the admin inquiry UI, inquiry delete.

## Done when

Admin GET → 200 + array; User GET → 403; **and BE-09's POST still returns 201 for the user.**
