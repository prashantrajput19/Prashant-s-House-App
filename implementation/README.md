# Implementation Plan — ArchitectPoint

Ordered, self-contained build steps. **Hand one file at a time to the AI**, in number order. Each
step states its own context, the exact files to create, the code to write, and how to verify before
moving on. No step depends on conversation history from a previous step.

## How to use this

1. Open `STEP-01-...md`, paste the whole file to the AI, let it implement.
2. Run the verification at the bottom of that step.
3. Only then move to the next step.

Do not skip ahead. Steps 03→09 build on each other and a half-finished security config produces
failures that look like controller bugs.

## Step order

| Step | File | Delivers | Test cases cleared |
|---|---|---|---|
| 01 | [STEP-01-frontend-models.md](STEP-01-frontend-models.md) | 5 Angular model interfaces | FE-01 … FE-05 (5) |
| 02 | [STEP-02-frontend-services.md](STEP-02-frontend-services.md) | 4 Angular services | FE-06 … FE-09 (4) |
| 03 | [STEP-03-backend-models.md](STEP-03-backend-models.md) | 5 JPA entities / DTO | — |
| 04 | [STEP-04-backend-repositories.md](STEP-04-backend-repositories.md) | 4 Spring Data repos | — |
| 05 | [STEP-05-jwt-security-config.md](STEP-05-jwt-security-config.md) | JWT + Spring Security 6 | — |
| 06 | [STEP-06-auth-endpoints.md](STEP-06-auth-endpoints.md) | register + login | BE-01 … BE-04 (4) |
| 07 | [STEP-07-architect-endpoints.md](STEP-07-architect-endpoints.md) | architect CRUD | BE-05 … BE-08 (4) |
| 08 | [STEP-08-inquiry-endpoints.md](STEP-08-inquiry-endpoints.md) | inquiry CRUD | BE-09 … BE-12 (4) |
| 09 | [STEP-09-feedback-endpoints.md](STEP-09-feedback-endpoints.md) | feedback CRUD | BE-13 … BE-15 (3) |
| 10 | [STEP-10-verify-and-run.md](STEP-10-verify-and-run.md) | full-suite run + DB reset | verifies all 24 |
| 11 | [STEP-11-ungraded-srs-work.md](STEP-11-ungraded-srs-work.md) | components, UI, AI feature | none (SRS completeness) |

Steps 01–02 are independent of 03–10. You can do the frontend first (9 quick wins, no database) or
run them in parallel.

## Non-negotiable rules for every step

These come from the SRS "Key points to remember" (p.43) and from how the graders actually work:

1. **Never rename or delete a graded file or exported symbol.** Field names, class names, file
   paths and endpoint URLs are all asserted.
2. **Never delete any existing file in the workspace.**
3. **Keep Spring Security enabled.** SRS p.43 suggests commenting it out or `permitAll()`-ing the
   GET endpoints for auto-evaluation — that advice breaks the graded suite. Ignore it.
4. **Spring Boot 3 ⇒ `jakarta.persistence.*`**, never `javax.persistence.*`.
5. **Don't touch `pom.xml`.** Every dependency needed is already there.
6. **Don't edit `angularapp/karma.conf.js`.** The grader overwrites it from `karma/karma.conf.js`.
7. **Reset the `appdb` database before each backend test run** — see STEP-10. The suite hard-codes
   generated IDs and will fail on a second run against dirty data.

## Reference

Per-test detail (what each test asserts, why it fails, gotchas) lives in `../context/`.
The SRS is `../ArchitectConnect_App_V4.pdf`. Where the SRS and the test files disagree, **the test
files win** — those disagreements are called out inline in the steps that hit them.
