# Shared Foundation — read this before any backend test case

Every backend test case (BE-01 … BE-15) depends on this scaffolding. Build it **once**, then work
through the individual test-case files. Nothing in the repo exists yet beyond empty stubs.

## Current state of the repo

| Area | State |
|---|---|
| `springapp/src/main/java/.../model/` | 5 files exist, **all empty class bodies** |
| `springapp/src/main/java/.../repository/` | 4 files exist, **all empty interfaces**, do not extend `JpaRepository` |
| `springapp/src/main/java/.../exceptions/` | 4 files exist, **all empty** |
| `springapp/src/main/java/.../config/` | **does not exist** |
| `springapp/src/main/java/.../service/` | **does not exist** |
| `springapp/src/main/java/.../controller/` | **does not exist** |
| `angularapp/src/app/models/` | **does not exist** |
| `angularapp/src/app/services/` | **does not exist** |

So all 24 test cases currently fail for the same root reason: the code under test was never written.

## The role matrix the tests actually enforce

This is derived from `junit/test/java/com/examly/springapp/SpringappApplicationTests.java`, which is
the source of truth. **Where it disagrees with the SRS PDF, the test file wins.**

| # | Endpoint | Method | Admin | User |
|---|---|---|---|---|
| 1,2 | `/api/register` | POST | 201 | 201 |
| 3,4 | `/api/login` | POST | 200 + `token` | 200 + `token` |
| 5 | `/api/architects` | POST | **201** | **403** |
| 6 | `/api/architects/{id}` | GET | **200** | **403** |
| 7 | `/api/architects` | GET | **200** | **200** |
| 8 | `/api/architects/{id}` | PUT | **200** | **403** |
| 9 | `/api/inquiries` | POST | **403** | **201** |
| 10 | `/api/inquiries` | GET | **200** | **403** |
| 11 | `/api/inquiries/user/{userId}` | GET | **403** | **200** |
| 12 | `/api/inquiries/{id}` | PUT | **200** | **403** |
| 13 | `/api/feedback` | POST | **403** | **201** |
| 14 | `/api/feedback` | GET | **200** | **403** |
| 15 | `/api/feedback/user/{userId}` | GET | **403** | **200** |

### Conflicts with the SRS you must resolve in favour of the tests

- **SRS p.43 says** you may put `GET /api/architects` and `GET /api/feedback` in `permitAll()`, or
  comment security out entirely. **Do not do that.** Test 14 requires `GET /api/feedback` to return
  **403** for a User, and tests 5/6/8/9/… require real role enforcement. Security must be **on**.
  Only `GET /api/architects` is genuinely role-open (test 7), and even then it still requires a
  valid token — leave it `authenticated()`, not `permitAll()`.
- The SRS lists `GET /api/inquiries/{inquiryId}` as `Admin, User`. No test covers it; implement per
  SRS, it will not be graded.

## Foundation work items

### F1 — Model classes (`model/`)

Fill the five empty classes. Use `jakarta.persistence.*` (Spring Boot 3, **not** `javax`).
Field names are graded — the JSON keys in the test assertions must match exactly.

- `User` — `userId` (Long, `@Id @GeneratedValue(strategy = IDENTITY)`), `email`, `password`,
  `username`, `mobileNumber`, `userRole`.
- `Architect` — `architectId` (Long, identity), `name`, `expertise`, `location`,
  `rating` (Double), `portfolioLink`, `status`.
- `ArchitectInquiry` — `inquiryId` (Long, identity), `user` (`@ManyToOne @JoinColumn(name="userId", nullable=false)`),
  `architect` (`@ManyToOne @JoinColumn(name="architectId", nullable=false)`), `message`, `status`,
  `priority`, `contactDetails`.
- `Feedback` — `feedbackId` (Long, identity), `feedbackText`, `date` (String),
  `user` (`@ManyToOne`, not null), `architect` (`@ManyToOne`, nullable), `category`.
- `LoginDTO` — plain POJO (no `@Entity`): `token`, `username`, `userRole`, `userId`.

All need no-arg constructor + getters/setters (Jackson needs them for both directions).

### F2 — Repositories (`repository/`)

Make each extend `JpaRepository<T, Long>` and add the finders the services need:

- `UserRepo extends JpaRepository<User, Long>` → `Optional<User> findByEmail(String email)`
- `ArchitectRepo extends JpaRepository<Architect, Long>`
- `ArchitectInquiryRepo extends JpaRepository<ArchitectInquiry, Long>` → `List<ArchitectInquiry> findByUserUserId(Long userId)`
- `FeedbackRepo extends JpaRepository<Feedback, Long>` → `List<Feedback> findByUserUserId(Long userId)`

### F3 — JWT + security config (`config/` — create the folder)

Per SRS p.9 screenshot, create: `CrosConfig`, `JwtUtils`, `JwtAuthenticationFilter`,
`JwtAuthenticationEntryPoint`, `MyUserDetailsService`, `UserPrinciple`, `SecurityConfig`.

- `pom.xml` already has `jjwt 0.9.1` + `jaxb-api` + `spring-boot-starter-security`. No pom changes needed.
- The token must carry the user's role. Put it in a claim and map it to authority `ROLE_Admin` /
  `ROLE_User` (matching the `userRole` values `"Admin"`/`"User"` the tests register with).
- `SecurityConfig` is Spring Security 6 style: a `SecurityFilterChain` `@Bean`, `csrf` disabled,
  `SessionCreationPolicy.STATELESS`, `permitAll()` on `/api/register` and `/api/login`, and the
  JWT filter added before `UsernamePasswordAuthenticationFilter`.
- Use a `PasswordEncoder` bean (BCrypt). If you hash on register you must verify with the encoder on
  login — do not mix plaintext storage with encoded comparison.

**Why 403 and not 401:** an authenticated principal with the wrong role produces 403 in Spring
Security. A missing/invalid token produces 401. Every "forbidden" assertion in the suite sends a
*valid* token of the *wrong* role, so 403 is correct — but only if the filter successfully
authenticates the request first. If your filter rejects or skips the token, you will get 401 and
every role test fails.

### F4 — Service layer (`service/` — create the folder)

Interfaces + `Impl` classes per SRS p.10–12: `UserService`, `ArchitectService`,
`ArchitectInquiryService`, `FeedbackService`. Only the methods used by the graded endpoints must
actually work; the rest can be implemented straightforwardly from the repo.

### F5 — Controllers (`controller/` — create the folder)

`AuthController`, `ArchitectController`, `ArchitectInquiryController`, `FeedbackController`.
Enforce roles with `@PreAuthorize("hasRole('Admin')")` (requires `@EnableMethodSecurity` on the
config) **or** with URL rules in `SecurityConfig`. Pick one approach and stay consistent — mixing
the two is the most common cause of a 403 landing where a 200 was expected.

## Test-ordering gotchas that will bite you

1. **The tests hard-code generated IDs.** BE-05 writes an architect and BE-06/08 read back
   `architectId == 1`; BE-09 posts an inquiry for `userId: 2` and BE-12 updates `inquiryId == 1`.
   This only holds against an **empty `appdb`**. `application.properties` currently has
   `spring.jpa.hibernate.ddl-auto=update`, so a second run keeps the old rows, auto-increment
   advances, and BE-05 onward fail with no code change. Either drop/recreate `appdb` before each
   run, or switch to `create-drop` while developing.
2. **Register must not 409 on re-run.** Same cause as above — `demoadmin@gmail.com` already exists.
3. **Tokens are shared across tests** via `@TestInstance(PER_CLASS)` + `@Order`. If BE-03/BE-04 fail
   to return a `token` field, every later test fails on `assertNotNull(admintoken)` instead of on
   its own logic. Fix login first; it unblocks 11 other tests.
4. The login response is parsed as `responseBody.get("token")` — the JSON key must be exactly
   `token`, so return the `LoginDTO`, not a bare string.

## Out of scope for the whole backend suite

- Angular components, routing, AuthGuard, any UI (not graded by JUnit).
- `DELETE` endpoints for architect / inquiry / feedback — no test covers them. Implement per SRS for
  app completeness, but they will not change any result.
- `getArchitectsByExpertise/Status/Location`, `searchArchitects`, `getUnresolvedInquiries`,
  `getInquiriesByPriority`, `getInquiriesByArchitectId`, `getFeedbacksByArchitectId` — SRS-required
  for the app, not exercised by any test.
- The entire **Phase 2 AI / Gemini feature** (SRS p.44–47) — `GeminiService`, `AiService`,
  `/api/ai/architect/{id}/feedback-summary`, `ai.service.ts`, `ai.model.ts`. No test case touches it.
- `ErrorLogs` table, custom error pages.
