# STEP 10 — Full verification, running the app, troubleshooting

**Project:** ArchitectPoint — Angular 16 (`angularapp`, port 8081) + Spring Boot 3.0.1 (`springapp`, port 8080) + MySQL `appdb`.
**Goal of this step:** get a clean 24/24 and know how to diagnose anything that isn't.
**Prerequisites:** STEP-01 … STEP-09.

## ⚠️ Reset the database before every backend run

The JUnit suite hard-codes auto-generated IDs: admin is `userId 1`, the test user is `userId 2`,
the architect is `architectId 1`, the inquiry is `inquiryId 1`. `application.properties` has
`spring.jpa.hibernate.ddl-auto=update`, so a second run keeps the old rows, auto-increment advances
past 1 and 2, and **BE-05 onward fail with no code change at all**.

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
# password: examly
```

Run this before *every* `mvn test`. Make it muscle memory — "it passed yesterday and fails today
with no edits" is almost always this.

## Backend — full suite

```bash
cd springapp
mvn -q test
```

Expect 15/15. Results also land in `springapp/target/surefire-reports/`.

To run one test:

```bash
mvn -q test -Dtest=SpringappApplicationTests#backend_testAdminAddArchitect
```

Remember the suite is `@Order`-ed and shares JWTs across tests via `@TestInstance(PER_CLASS)`.
Running a single later test in isolation fails on `assertNotNull(admintoken)` — that is expected,
not a bug. Include the login tests when narrowing down:

```bash
mvn -q test -Dtest=SpringappApplicationTests#backend_testRegisterAdmin+backend_testRegisterUser+backend_testLoginAdmin+backend_testLoginUser+backend_testAdminAddArchitect
```

## Frontend — full suite

```bash
nvm use 20
cd angularapp
npm install      # first run only
npm test
```

Expect 9/9.

Note the grader overwrites `angularapp/karma.conf.js` with `karma/karma.conf.js` on every run —
never rely on local edits to that file.

## Running the application

Backend (port 8080):

```bash
cd springapp && mvn spring-boot:run
```

Frontend (port 8081):

```bash
nvm use 20 && cd angularapp && npm start
```

The backend must be up on 8080 before using the UI or clicking "Run Test Case".

## Final checklist

- [ ] `appdb` dropped and recreated
- [ ] `mvn test` → 15/15
- [ ] `npm test` → 9/9
- [ ] `springapp` boots on 8080, `angularapp` on 8081
- [ ] No file was deleted or renamed anywhere in the workspace
- [ ] `pom.xml` unmodified
- [ ] Spring Security still enabled (not commented out)

## Troubleshooting by symptom

| Symptom | Likely cause | Where to look |
|---|---|---|
| All 9 frontend tests FAIL, no compile output | Wrong file path or filename | STEP-01 / STEP-02 paths; especially `architect-inquery.service.ts` |
| FE-08 alone fails | Filename spelled `inquiry` instead of `inquery` | STEP-02 |
| All 9 frontend tests fail *with* a TS error | One compile error anywhere in `src/` | Usually a missing field on `ArchitectInquiry` (STEP-01) or a half-written component |
| Backend tests all fail at `assertNotNull(admintoken)` | Login isn't returning `{"token": ...}` | STEP-06 — the JSON key must be exactly `token` |
| Everything returns **401** instead of 403/200 | JWT filter isn't authenticating | STEP-05 `JwtAuthenticationFilter` — must populate `SecurityContext` and never throw |
| Role tests fail but happy paths pass | Both tokens carry the same role | STEP-06 — read `userRole` from the DB row; decode both tokens to confirm |
| BE-06 and BE-07 can't both pass | A `**` wildcard in the architect matchers | STEP-05 — use `/api/architects/*`, single star |
| BE-11 or BE-15 inverted (Admin 200 / User 403) | `/user/*` rule declared after the broader rule | STEP-05 — most specific matcher first |
| BE-14: User gets 200 | `GET /api/feedback` was `permitAll()`-ed per SRS p.43 | STEP-05 / STEP-09 — must be `hasRole("Admin")` |
| BE-09 or BE-13 returns 500 | Nested id-only stubs saved as transient entities | STEP-08 / STEP-09 — resolve from repos first |
| 500 with a huge recursive JSON / stack overflow | Bidirectional entity relation | STEP-03 — keep `@ManyToOne` relations unidirectional |
| App won't start: `PropertyReferenceException` | Bad derived-query method name | STEP-04 — `findByUserUserId` |
| Compile errors on `javax.persistence` | Spring Boot 3 uses `jakarta.*` | STEP-03 |
| Compile error: `WebSecurityConfigurerAdapter` not found | Removed in Spring Security 6 | STEP-05 — lambda DSL + `SecurityFilterChain` bean |
| BE-05+ fail only on re-run | Dirty database | Reset `appdb` (top of this file) |

## Update the tracker

Mark each passing case in `../context/progress.md` as you go, so a later session can pick up
exactly where this one stopped.
