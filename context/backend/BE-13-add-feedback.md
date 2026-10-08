# BE-13 — `backend_testAddFeedbackWithRoleValidation`

**Status:** Failing · **Order:** 13 · **Depends on:** BE-02, BE-05 · **Blocks:** BE-14, BE-15

## What the test does

`POST /api/feedback` with:

```json
{ "feedbackText": "Excellent architectural service", "date": "2025-02-27",
  "category": "Service", "user": {"userId": 2}, "architect": {"architectId": 1} }
```

- **User token** → **201**, body asserts `feedbackText` and `category == "Service"`.
- **Admin token** → **403 FORBIDDEN**.

## Why it fails today

No `FeedbackController`, no `FeedbackService`, `Feedback` is an empty class, `FeedbackRepo` is an
empty interface.

## What to implement

1. **`Feedback` model** — Foundation F1: `feedbackId` (identity), `feedbackText`,
   `date` (**String**, not `LocalDate`), `user` (`@ManyToOne`, not null),
   `architect` (`@ManyToOne`, **nullable = true** per SRS), `category`.
2. **`FeedbackRepo extends JpaRepository<Feedback, Long>`.**
3. **`FeedbackService.createFeedback(Feedback)` → `Feedback`** + `Impl`.
4. **`FeedbackController`** — `@RestController @RequestMapping("/api/feedback")`
   (singular — matches the SRS and the tests), `@PostMapping` → **201** + saved entity.
5. **User-only rule** on `POST /api/feedback`.

## Files

**Create:** `controller/FeedbackController.java`, `service/FeedbackService.java`,
`service/FeedbackServiceImpl.java`
**Modify:** `model/Feedback.java`, `repository/FeedbackRepo.java`, `config/SecurityConfig.java`

## Gotchas

- **`date` is a `String`.** The payload sends `"2025-02-27"`. Typing the field as `LocalDate`/`Date`
  works for this value but diverges from the SRS (which specifies String, ISO format) and from the
  Angular model. Keep it `String` on both sides.
- **Id-only nested stubs again** — same hazard as BE-09. Resolve `User` 2 and `Architect` 1 from
  their repos and attach managed entities before saving.
- **The URL is `/api/feedback`, singular.** Not `/api/feedbacks`. Easy slip given the service method
  is `getAllFeedbacks()`.
- **403 for Admin** — feedback is authored by Users only.
- Return **201**, and return the saved entity as the body (two fields are asserted on it).

## Out of scope

`DELETE /api/feedback/{id}`, `getFeedbackById`, `getFeedbacksByArchitectId`, rating recalculation
on the architect, the feedback form UI, the Phase-2 AI summary feature.

## Done when

User POST → 201 with `feedbackText` and `category` echoed; Admin POST → 403.
