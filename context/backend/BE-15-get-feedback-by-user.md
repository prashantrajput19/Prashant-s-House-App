# BE-15 — `backend_testGetFeedbackByUserIdWithRoleValidation`

**Status:** Failing · **Order:** 15 · **Depends on:** BE-02, BE-13

## What the test does

`GET /api/feedback/user/2`:

- **User token** → **200**.
- **Admin token** → **403 FORBIDDEN**.

Body is not inspected.

## Why it fails today

No `GET /api/feedback/user/{userId}` endpoint.

## What to implement

1. **`FeedbackRepo`** — add `List<Feedback> findByUserUserId(Long userId)`.
2. **`FeedbackService.getFeedbacksByUserId(Long userId)` → `List<Feedback>`** + `Impl`.
3. **`FeedbackController`** — `@GetMapping("/user/{userId}")`, 200 + list.
4. **User-only rule** on `/api/feedback/user/**`.

## Files

**Modify:** `repository/FeedbackRepo.java`, `service/FeedbackService.java` + `Impl`,
`controller/FeedbackController.java`, `config/SecurityConfig.java`

## Gotchas

- **Admin gets 403**, mirroring BE-11. This is the "My Feedback" endpoint; the admin uses
  `GET /api/feedback` (BE-14) instead.
- **Matcher ordering, again:** `/api/feedback/user/**` → `hasRole("User")` must be declared
  **before** any `/api/feedback/**` → `hasRole("Admin")` rule, or this returns 403 for the user and
  200 for the admin — exactly inverted.
- **Routing collision:** if you also implement the SRS's `GET /api/feedback/{feedbackId}`, the
  literal `/user/...` segment must still win. Verify both paths after adding the single-feedback
  mapping.
- The feedback controller now has four rules under one prefix (POST→User, GET collection→Admin,
  GET `/user/**`→User, DELETE→User). Review them as a group once all four exist.

## Out of scope

Ownership enforcement (the token's user need not equal the path `userId`), pagination, the
My-Feedback UI, delete.

## Done when

User GET `/api/feedback/user/2` → 200; Admin → 403; BE-13 and BE-14 still pass.
