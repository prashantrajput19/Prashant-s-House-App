# STEP 11 — Ungraded SRS work (components, UI, AI feature)

**Project:** ArchitectPoint — Angular 16 + Spring Boot 3.0.1.
**Goal of this step:** complete everything the SRS requires that **no test case checks**.
**Prerequisites:** STEP-01 … STEP-10, with 24/24 green.

## ⚠️ Read this before you start

**Do this only after 24/24 passes, and re-run both suites afterwards.**

The Karma grader compiles the entire Angular app. **A single TypeScript error in any component you
add here fails all nine frontend tests**, including the five model tests that have nothing to do
with your new code. Re-run `npm test` after each component, not at the end.

Nothing in this step changes the score. It exists because the SRS asks for a working application.

## A. Angular components

Create under `angularapp/src/app/components/` (SRS p.13 lists these exact folder names):

`admin-add-architect`, `admin-control-panel`, `admin-edit-architect`, `admin-view-architect`,
`admin-view-feedback`, `admin-view-inquiry`, `adminnav`, `authguard`, `error`, `home-page`,
`login`, `signup`, `user-add-feedback`, `user-add-inquiry`, `user-view-architect`,
`user-view-feedback`, `user-view-inquiries`, `usernav`.

```bash
cd angularapp && npx ng g c components/login
```

Key behaviours from the SRS screenshots (p.19–42):

- **Login is the landing page.** Email + password with regex validation; inline messages
  ("Email is required", "Please enter a valid email", "Password must be at least 6 characters");
  "Invalid Email or Password" on failed auth; routes to `adminnav` or `usernav` by role.
- **Signup:** username, email, mobile (10 digits), password, confirm-password (must match), role
  select. Success modal → "User Registration is Successful!" → OK → login page.
- **AuthGuard** implements `canActivate`; any direct URL entry without a token redirects to login.
  Logout returns to login.
- **Navbars** show `username / role` and differ by role (SRS p.19 screenshots).
- **Empty states** use exact copy: `"No Architects available. Add some Architect to view here."`,
  `"No architects found. Add new architect to see them"`, `"No inquiries found."`,
  `"No data found"`, `"No data available"`.
- **Modals** use exact copy: `"Architect added successfully!"`, `"Architect updated successfully!"`,
  `"Failed to add Architect!"`, `"Your inquiry has been successfully submitted."`,
  `"Feedback submitted successfully!"`, `"Failed to submit feedback. Please try again."`,
  and confirm dialogs for delete / logout.
- **error component** displays `"Something Went Wrong"`.
- Assets `background.webp` and `homepage.webp` already exist in `angularapp/src/assets/images/`.

Wire routes in `app-routing.module.ts` with the AuthGuard on everything except login and signup.

**Respect the role matrix** when choosing service methods — e.g. the admin feedback screen must
call `getFeedbacks()` (Admin-only), not `getAllFeedbacksByUserId()` (User-only), or it gets a 403
at runtime that Karma will never catch.

## B. Backend — remaining SRS service methods

Ungraded but specified. Add to the existing interfaces and impls:

**`ArchitectService`:** `getArchitectsByExpertise(String)`, `getArchitectsByStatus(String)`,
`searchArchitects(String keyword)`, `getArchitectsByLocation(String)`.

**`ArchitectInquiryService`:** `getInquiriesByArchitectId(Long)`, `getUnresolvedInquiries()`,
`getInquiriesByPriority(String)`.

**`FeedbackService`:** `getFeedbacksByArchitectId(Long)`.

Back them with derived queries (`findByExpertise`, `findByStatusNot`, …) on the repos.

## C. Backend — exception handling

Four stub classes exist and are still empty:
`exceptions/ArchitectException.java`, `ArchitectInquiryException.java`,
`DuplicateArchitectException.java`, `GlobalExceptionHandler.java`.

Make the first three extend `RuntimeException` with message constructors, and annotate
`GlobalExceptionHandler` with `@RestControllerAdvice` + `@ExceptionHandler` methods.

**Then immediately re-run `mvn test`.** A `@RestControllerAdvice` that catches broadly can convert
an expected 403 into a 500 or 400 and break the role tests. If the suite goes red, narrow the
handlers to your own exception types and never catch `Exception` or `AccessDeniedException`.

The SRS also asks for an `ErrorLogs` table recording handled exceptions — optional, no test.

## D. Phase 2 — Gemini AI feature (SRS p.44–47)

Entirely ungraded. Build last.

**Backend:**
- `service/GeminiService.java` — `embed(text)`, `generate(prompt)`, `isEnabled()`.
  `isEnabled()` returns true only when `gemini.api.key` is non-empty; `generate()` returns `null`
  when disabled or on failure.
- `service/AiService.java` — `summarizeArchitectFeedback(architectId)`. No feedback → informational
  message, `feedbackCount` 0, `aiScore` null, no Gemini call. Gemini disabled → plain message.
  Otherwise prompt Gemini with every feedback entry prefixed by its category, parse the JSON into
  summary / strengths / improvements / score, and **fall back to a plain count message if the
  response is missing or malformed** — an outage must never break the admin view.
- `GET /api/ai/architect/{architectId}/feedback-summary`, **Admin only** — add a matcher
  `.requestMatchers(HttpMethod.GET, "/api/ai/architect/**").hasRole("Admin")` in `SecurityConfig`.
  Read-only; never writes.
- `application.properties`: `gemini.api.key`, `gemini.embedding.model` (e.g.
  `text-embedding-004`), `gemini.generation.model` (e.g. `gemini-2.5-flash`).

**Frontend:**
- `services/ai.service.ts` — `getArchitectFeedbackSummary(architectId)`, Bearer token from
  `localStorage`.
- `models/ai.model.ts` — `ArchitectFeedbackSummary { architectId, architectName, feedbackCount,
  averageRating: number | null, summary, strengths: string[], improvements: string[],
  aiScore: number | null }`.
- `admin-view-architect`: an "AI Summary" button per row opening a modal with a loading state,
  then count / average rating / AI score / summary / strengths / improvements. Render the
  backend's informational message gracefully for the no-feedback and disabled cases.

**Do not commit a real API key.** Leave `gemini.api.key` empty — the feature is designed to degrade
to the non-AI fallback, which keeps every existing test intact.

## Final regression

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
cd springapp && mvn -q test      # expect 15/15
cd ../angularapp && npm test     # expect 9/9
```

Both suites must still be green. If the frontend dropped from 9/9, the cause is a compile error in
a component added in section A — not in the models or services.
