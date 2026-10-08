# BE-14 — `backend_testGetAllFeedbackWithRoleValidation`

**Status:** Failing · **Order:** 14 · **Depends on:** BE-13

## What the test does

`GET /api/feedback`:

- **Admin token** → **200**. *(Body is not inspected — no `isArray()` assertion here.)*
- **User token** → **403 FORBIDDEN**.

## Why it fails today

No `GET /api/feedback` endpoint.

## What to implement

1. **`FeedbackService.getAllFeedbacks()` → `List<Feedback>`** + `Impl` (`repo.findAll()`).
2. **`FeedbackController`** — `@GetMapping` on the class path, 200 + list.
3. **Admin-only rule** on `GET /api/feedback`.

## Files

**Modify:** `controller/FeedbackController.java`, `service/FeedbackService.java` + `Impl`,
`config/SecurityConfig.java`

## Gotchas

- **This test directly contradicts SRS p.43**, which suggests adding `GET /api/feedback` to
  `permitAll()` for auto-evaluation. If you do that, the User branch returns 200 and this test
  **fails**. Leave it Admin-only. (The same SRS note about `GET /api/architects` is harmless — see
  BE-07 — but this one is actively wrong for the graded suite.)
- **Same URL, opposite roles by method:** `POST /api/feedback` is User-only (BE-13),
  `GET /api/feedback` is Admin-only. Method-aware matchers required, exactly as in BE-10.
- Because the body is unchecked, a 200 here does not prove your serialisation works — BE-15 and the
  admin feedback screen will expose any nested-entity problems.

## Out of scope

Category filtering, the admin feedback table UI, delete, the AI summary endpoint.

## Done when

Admin GET → 200; User GET → 403; BE-13's POST still returns 201 for the user token.
