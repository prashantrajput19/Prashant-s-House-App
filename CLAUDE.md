# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**ArchitectPoint** — a graded assessment project (Examly/iamneo). A platform connecting users with
architects: architect listings, inquiries, feedback, role-based Admin/User access.

The work is scored by **24 automated test cases** — 15 Maven/JUnit (backend) + 9 Karma (frontend).
Passing them is the objective. The spec is `ArchitectConnect_App_V4.pdf` at the repo root.

**Stack:** Angular 16 (port 8081) · Spring Boot 3.0.1 / Java 17 (port 8080) · MySQL `appdb` · JWT auth.

## Current state

**24 of 24 tests pass** (15 backend + 9 frontend). Backend models, repositories, services,
controllers and JWT security config are complete. The Angular app has all five models, all four
services, an AuthGuard, two role navbars and 16 screens, styled by the design system in
`src/styles.css`. Still open: the four empty `exceptions/` stubs, the extra SRS finder methods
(STEP-11 sections B and C), and the Phase-2 Gemini feature (section D) — all ungraded.

## Layout

```
springapp/      Spring Boot backend (com.examly.springapp)
angularapp/     Angular 16 frontend
junit/          JUnit suite + runner — SOURCE OF TRUTH for backend grading
karma/          Karma specs + runner  — SOURCE OF TRUTH for frontend grading
context/        Per-test-case analysis: what each test asserts, why it fails, gotchas
implementation/ Ordered build steps (STEP-01 … STEP-11), each a self-contained prompt
```

Start at `implementation/README.md`. Per-test detail is in `context/progress.md`.

## Commands

```bash
# Backend — ALWAYS reset the DB first (see Hard rules #1)
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"  # pw: examly
cd springapp && mvn -q test              # 15 backend tests
cd springapp && mvn spring-boot:run      # port 8080

# Frontend
nvm use 20
cd angularapp && npm install && npm test # 9 frontend tests
cd angularapp && npm start               # port 8081
```

Single backend test (include the login tests — the suite is `@Order`-ed and shares JWTs, so later
tests fail in isolation on `assertNotNull(admintoken)`):

```bash
mvn -q test -Dtest=SpringappApplicationTests#backend_testLoginAdmin+backend_testLoginUser+backend_testAdminAddArchitect
```

## Hard rules

1. **Reset `appdb` before every backend run.** The suite hard-codes generated IDs (`userId` 1 and
   2, `architectId` 1, `inquiryId` 1) and `ddl-auto=update` preserves rows. A second run against
   dirty data fails BE-05 onward **with no code change**. This is the #1 cause of phantom failures.
2. **Keep Spring Security enabled.** The SRS (p.43) says you may comment it out or `permitAll()`
   the GET endpoints for auto-evaluation — that advice breaks the graded suite. Ignore it.
3. **Never delete or rename** any existing file, exported symbol, field name, or endpoint URL.
   They are all asserted somewhere.
4. **Don't modify `pom.xml`** — every dependency is already present.
5. **Don't edit `angularapp/karma.conf.js`** — the grader overwrites it from `karma/karma.conf.js`.
6. **Spring Boot 3 ⇒ `jakarta.persistence.*` / `jakarta.servlet.*`**, never `javax.*`. Spring
   Security 6 ⇒ `SecurityFilterChain` bean + lambda DSL; `WebSecurityConfigurerAdapter` is gone.
7. **Never `git push` or open PRs** in this repo.

## Where the SRS is wrong

The PDF and the test files disagree in three places. **The test files win.**

| SRS says | Tests require |
|---|---|
| `GET /api/feedback` may be `permitAll()` (p.43) | User must get **403** (BE-14) |
| Security may be commented out for auto-eval (p.43) | Real role enforcement on 11 tests |
| `ArchitectInquiry` frontend interface has 6 fields (p.15) | Also needs `status`, `inquiryDate`, `responseDate` (FE-04) |

## Role matrix (from the JUnit suite, not the PDF)

| Endpoint | Method | Admin | User |
|---|---|---|---|
| `/api/register`, `/api/login` | POST | 201 / 200 | 201 / 200 |
| `/api/architects` | POST | 201 | **403** |
| `/api/architects/{id}` | GET | 200 | **403** |
| `/api/architects` | GET | 200 | **200** ← both |
| `/api/architects/{id}` | PUT | 200 | **403** |
| `/api/inquiries` | POST | **403** | 201 |
| `/api/inquiries` | GET | 200 | **403** |
| `/api/inquiries/user/{id}` | GET | **403** | 200 |
| `/api/inquiries/{id}` | PUT | 200 | **403** |
| `/api/feedback` | POST | **403** | 201 |
| `/api/feedback` | GET | 200 | **403** |
| `/api/feedback/user/{id}` | GET | **403** | 200 |

Roles invert between resources. Enforce via **URL matchers in `SecurityConfig` only** — do not mix
in `@PreAuthorize`. Use single `*` (`/api/architects/*`), never `**`, or the Admin-only
by-id rule swallows the both-roles collection rule. Declare `/user/*` rules **before** broader ones.

## Traps that cost the most time

- **`services/architect-inquery.service.ts` is misspelled on purpose** ("inqu**e**ry") while the
  class is `ArchitectInquiryService` ("inqu**i**ry"). `karma.sh` checks that exact filename and
  prints FAILED without compiling if it's wrong. The *model* file uses the correct spelling.
- **Login must return JSON with the key exactly `token`.** 11 tests read
  `body.get("token")` and fail on NPE otherwise.
- **The two JWTs must carry different roles.** Read `userRole` from the DB row. A role-blind token
  still passes the login tests, then fails six later tests for unrelated-looking reasons.
- **401 instead of 403 everywhere** means the JWT filter isn't populating `SecurityContext`. The
  "forbidden" assertions all send a *valid* token with the *wrong* role.
- **Nested payloads arrive as id-only stubs** (`"user": {"userId": 2}`). Resolve them from the
  repos before saving or the insert 500s.
- **Keep JPA relations unidirectional** — a bidirectional pair without `@JsonIgnore` causes
  infinite recursion and turns a 201 into a 500.
- **One TypeScript error anywhere fails all nine Karma tests**, including unrelated model tests.
  Re-run `npm test` after adding each component.

`implementation/STEP-10-verify-and-run.md` has a full symptom → cause → file table.

## Working conventions

- Follow `implementation/` in order; verify at each step before continuing.
- Update the status table in `context/progress.md` as tests go green.
- Prefer editing the existing empty stubs over creating new files.
- No Lombok (not a dependency) — write accessors out.
- Components and the Phase-2 Gemini AI feature are **ungraded**; build them only after 24/24, and
  re-run both suites afterwards.
