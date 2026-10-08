# BE-11 — `backend_testUserCanViewOwnInquiries`

**Status:** Failing · **Order:** 11 · **Depends on:** BE-02, BE-09

## What the test does

`GET /api/inquiries/user/2`:

- **User token** → **200**, body `isArray()`.
- **Admin token** → **403 FORBIDDEN**.

## Why it fails today

No `GET /api/inquiries/user/{userId}` endpoint.

## What to implement

1. **`ArchitectInquiryRepo`** — add `List<ArchitectInquiry> findByUserUserId(Long userId)`.
   (Derived-query path: `user` → `userId`. `findByUser_UserId` with the underscore also works.)
2. **`ArchitectInquiryService.getInquiriesByUserId(Long userId)` → `List<ArchitectInquiry>`** + `Impl`.
3. **`ArchitectInquiryController`** — `@GetMapping("/user/{userId}")`, 200 + bare list.
4. **User-only rule** on this path.

## Files

**Modify:** `repository/ArchitectInquiryRepo.java`, `service/ArchitectInquiryService.java` + `Impl`,
`controller/ArchitectInquiryController.java`, `config/SecurityConfig.java`

## Gotchas

- **Admin gets 403 here** even though Admin can see *all* inquiries via BE-10. Counter-intuitive but
  that is what the test demands — this is the "My Inquiries" endpoint and it is User-scoped.
- **Routing collision risk:** `/api/inquiries/user/2` must not be swallowed by a
  `@GetMapping("/{inquiryId}")` handler on the same controller. `user` is not a valid `Long`, so if
  the single-inquiry mapping wins you get a 400 type-mismatch instead of 200. Spring prefers the
  literal segment over the template, so this usually resolves correctly — but confirm it, and if you
  implement the SRS's `GET /api/inquiries/{inquiryId}`, test both paths together.
- **Security matcher must also be specific:** a rule on `/api/inquiries/**` with `hasRole("Admin")`
  (added for BE-12's PUT) will capture this path too and break it. Declare
  `/api/inquiries/user/**` → `hasRole("User")` **before** any broader `/api/inquiries/**` rule.
- Bare JSON array required.
- No ownership check is tested — the endpoint does not need to verify that the token's user *is*
  user 2. Keep it simple.

## Out of scope

Enforcing that a user can only read their own id, pagination, filtering, the My-Inquiries UI.

## Done when

User GET `/api/inquiries/user/2` → 200 + array; Admin → 403; BE-10 and BE-12 unaffected.
