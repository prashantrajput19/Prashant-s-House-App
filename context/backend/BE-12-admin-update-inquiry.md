# BE-12 — `backend_testAdminCanUpdateInquiry_UserCannot`

**Status:** Failing · **Order:** 12 · **Depends on:** BE-09 (inquiryId 1)

## What the test does

`PUT /api/inquiries/1` with:

```json
{ "inquiryId": 1, "message": "Updated inquiry message", "status": "Resolved",
  "priority": "Medium", "contactDetails": "updated@email.com",
  "user": {"userId": 2}, "architect": {"architectId": 1} }
```

- **Admin token** → **200**, body asserts `status == "Resolved"`, `priority == "Medium"`,
  `message == "Updated inquiry message"`.
- **User token** → **403 FORBIDDEN**.

This is the "admin changes inquiry status" flow from the SRS.

## Why it fails today

No `PUT /api/inquiries/{inquiryId}` endpoint.

## What to implement

1. **`ArchitectInquiryService.updateInquiry(Long inquiryId, ArchitectInquiry updatedInquiry)`
   → `ArchitectInquiry`** (SRS signature) + `Impl`: load existing, copy `message`, `status`,
   `priority`, `contactDetails`, save, return.
2. **`ArchitectInquiryController`** — `@PutMapping("/{inquiryId}")`, 200 + updated entity,
   404 if absent (untested).
3. **Admin-only rule** on `PUT /api/inquiries/*`.

## Files

**Modify:** `controller/ArchitectInquiryController.java`,
`service/ArchitectInquiryService.java` + `Impl`, `config/SecurityConfig.java`

## Gotchas

- **Role flips again.** `POST /api/inquiries` = User-only, `PUT /api/inquiries/{id}` = Admin-only.
  Three different role rules now live under `/api/inquiries` (POST→User, GET collection→Admin,
  GET `/user/**`→User, PUT→Admin). Write these as four explicit method-aware matchers and keep
  `/api/inquiries/user/**` **above** `/api/inquiries/**` — see BE-11.
- **Update in place.** Load inquiry 1 and mutate; don't persist a new row from the deserialised
  body (its `user`/`architect` are id-only stubs again — reuse the existing managed relations
  rather than re-attaching, unless you resolve them from the repos as in BE-09).
- The response body must reflect the **post-update** values.
- `inquiryId == 1` only holds on a clean DB where BE-09 inserted the first inquiry.

## Out of scope

Status-transition validation (`Pending → Resolved → Closed`), notifying the user, audit history,
inquiry delete.

## Done when

Admin PUT → 200 with the three updated fields; User PUT → 403; the existing row is mutated, not
duplicated.
