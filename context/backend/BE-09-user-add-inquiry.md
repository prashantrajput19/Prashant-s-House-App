# BE-09 — `backend_testUserCanAddArchitectInquiry`

**Status:** Failing · **Order:** 9 · **Depends on:** BE-02 (userId 2), BE-05 (architectId 1) · **Blocks:** BE-10, BE-11, BE-12

## What the test does

`POST /api/inquiries` with:

```json
{ "message": "I need a residential architect for a villa project",
  "status": "Pending", "priority": "High",
  "contactDetails": "user@email.com, 9876543210",
  "user": {"userId": 2}, "architect": {"architectId": 1} }
```

- **User token** → **201**, body asserts `status == "Pending"`, `priority == "High"`,
  `message` echoed.
- **Admin token** → **403 FORBIDDEN**. *(Role is inverted vs. the architect endpoints.)*

## Why it fails today

No `ArchitectInquiryController`, no service, `ArchitectInquiry` is an empty class.

## What to implement

1. **`ArchitectInquiry` model** — Foundation F1, including the two `@ManyToOne` relations with
   `@JoinColumn(name="userId")` / `@JoinColumn(name="architectId")`, both `nullable = false`.
2. **`ArchitectInquiryRepo extends JpaRepository<ArchitectInquiry, Long>`.**
3. **`ArchitectInquiryService.createInquiry(ArchitectInquiry)` → `ArchitectInquiry`** + `Impl`.
4. **`ArchitectInquiryController`** — `@RestController @RequestMapping("/api/inquiries")`,
   `@PostMapping` returning **201** with the saved inquiry.
5. **User-only rule** on `POST /api/inquiries` → `hasRole("User")`.

## Gotchas

- **The nested objects arrive as id-only stubs.** `{"userId": 2}` has no email/password/username.
  Jackson will happily build a `User` with only `userId` set; if you then `save()` that transient
  object Hibernate may try to insert a blank user or throw on the not-null columns.
  **Resolve both references from the DB before saving** — load `User` 2 and `Architect` 1 via their
  repos and attach the managed entities to the inquiry. This is the single most common failure here.
- **The response must serialise cleanly.** `ArchitectInquiry → User → …` can recurse if you ever add
  a back-reference collection. Keep the relations unidirectional, or annotate with
  `@JsonIgnoreProperties`. A serialisation blow-up turns 201 into 500.
- `status` is sent by the client (`"Pending"`) and asserted back. Do **not** overwrite it with a
  server-side default — if you default `status` to `"Pending"` that happens to match here, but
  BE-12 then updates it to `"Resolved"` and any forced default would break that.
- **403 for Admin.** This endpoint is User-only, the inverse of BE-05. Easy to copy-paste the wrong
  role in.
- The saved row must become `inquiryId == 1` for BE-12.

## Files

**Create:** `controller/ArchitectInquiryController.java`,
`service/ArchitectInquiryService.java`, `service/ArchitectInquiryServiceImpl.java`
**Modify:** `model/ArchitectInquiry.java`, `repository/ArchitectInquiryRepo.java`,
`config/SecurityConfig.java`

## Out of scope

`DELETE /api/inquiries/{id}`, `getInquiriesByArchitectId`, `getUnresolvedInquiries`,
`getInquiriesByPriority`, `GET /api/inquiries/{inquiryId}` (single, untested),
`ArchitectInquiryException`.

## Done when

User POST → 201 with the three asserted fields and a correctly linked user/architect;
Admin POST → 403.
