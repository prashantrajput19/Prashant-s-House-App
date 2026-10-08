# ArchitectPoint — Test Case Progress Tracker

**Total: 24 test cases — 15 Maven/JUnit (backend) + 9 Karma (frontend). Currently 24 passing.**

Last updated: 2026-10-02

**STEP-10 verification run (2026-10-02):** `appdb` dropped/recreated, backend 15/15
(`surefire-reports` clean), frontend 9/9, `springapp` boots on 8080 and `angularapp`
on 8081, admin JWT returns 200 on `/api/architects`, `/api/inquiries`, `/api/feedback`.
No files deleted or renamed, `pom.xml` unmodified, Spring Security still enabled.

Status legend: `Not started` · `In progress` · `Passing` · `Blocked`

---

## Backend — Maven JUnit (15)

Source of truth: `junit/test/java/com/examly/springapp/SpringappApplicationTests.java`
Tests run in `@Order` sequence and share JWT tokens, so **earlier failures cascade**.

| # | Test case | Context file | Status | Notes |
|---|---|---|---|---|
| BE-01 | `backend_testRegisterAdmin` | [BE-01](backend/BE-01-register-admin.md) | **Passing** | Needs AuthController + User + UserRepo |
| BE-02 | `backend_testRegisterUser` | [BE-02](backend/BE-02-register-user.md) | **Passing** | Free once BE-01 works; must land on `userId 2` |
| BE-03 | `backend_testLoginAdmin` | [BE-03](backend/BE-03-login-admin.md) | **Passing** | **Highest leverage** — unblocks 11 tests |
| BE-04 | `backend_testLoginUser` | [BE-04](backend/BE-04-login-user.md) | **Passing** | Token must carry `User` role |
| BE-05 | `backend_testAdminAddArchitect` | [BE-05](backend/BE-05-admin-add-architect.md) | **Passing** | Admin 201 / User 403 |
| BE-06 | `backend_testGetArchitectByIdWithRoleValidation` | [BE-06](backend/BE-06-get-architect-by-id.md) | **Passing** | Admin 200 / User **403** |
| BE-07 | `backend_testGetAllArchitects` | [BE-07](backend/BE-07-get-all-architects.md) | **Passing** | Both roles **200** — conflicts with BE-06 matcher |
| BE-08 | `backend_testUpdateArchitectWithRoleValidation` | [BE-08](backend/BE-08-update-architect.md) | **Passing** | Update in place, don't insert |
| BE-09 | `backend_testUserCanAddArchitectInquiry` | [BE-09](backend/BE-09-user-add-inquiry.md) | **Passing** | User 201 / Admin 403; resolve nested id stubs |
| BE-10 | `backend_testRoleBasedAccessForViewingAllInquiries` | [BE-10](backend/BE-10-view-all-inquiries.md) | **Passing** | Admin 200 / User 403 |
| BE-11 | `backend_testUserCanViewOwnInquiries` | [BE-11](backend/BE-11-user-view-own-inquiries.md) | **Passing** | User 200 / Admin **403** |
| BE-12 | `backend_testAdminCanUpdateInquiry_UserCannot` | [BE-12](backend/BE-12-admin-update-inquiry.md) | **Passing** | Admin 200 / User 403 |
| BE-13 | `backend_testAddFeedbackWithRoleValidation` | [BE-13](backend/BE-13-add-feedback.md) | **Passing** | User 201 / Admin 403 |
| BE-14 | `backend_testGetAllFeedbackWithRoleValidation` | [BE-14](backend/BE-14-get-all-feedback.md) | **Passing** | Admin 200 / User 403 — **do not `permitAll()`** |
| BE-15 | `backend_testGetFeedbackByUserIdWithRoleValidation` | [BE-15](backend/BE-15-get-feedback-by-user.md) | **Passing** | User 200 / Admin **403** |

## Frontend — Karma (9)

Source of truth: the spec files in `karma/`, copied in by `karma/karma.sh`.
All nine are existence + compile checks. **One compile error fails all nine.**

| # | Test case | Context file | Status | Notes |
|---|---|---|---|---|
| FE-01 | `frontend_User_model_should_create_an_instance` | [FE-01](frontend/FE-01-user-model.md) | ✅ Passing | `userId` must be optional |
| FE-02 | `frontend_Login_model_should_create_an_instance` | [FE-02](frontend/FE-02-login-model.md) | ✅ Passing | email + password only |
| FE-03 | `frontend_Architect_model_should_create_an_instance` | [FE-03](frontend/FE-03-architect-model.md) | ✅ Passing | Matches SRS as-is |
| FE-04 | `frontend_Architect_Inquiry_model_should_create_an_instance` | [FE-04](frontend/FE-04-architect-inquiry-model.md) | ✅ Passing | **SRS is wrong** — add `status`, `inquiryDate`, `responseDate` |
| FE-05 | `frontend_Feedback_model_should_create_an_instance` | [FE-05](frontend/FE-05-feedback-model.md) | ✅ Passing | `date` is a string |
| FE-06 | `frontend_should_create_auth_service` | [FE-06](frontend/FE-06-auth-service.md) | ✅ Passing | No `Router` injection |
| FE-07 | `frontend_should_create_architect_service` | [FE-07](frontend/FE-07-architect-service.md) | ✅ Passing | — |
| FE-08 | `frontend_should_create_architect_inquiry_service` | [FE-08](frontend/FE-08-architect-inquiry-service.md) | ✅ Passing | **Filename `architect-inquery.service.ts`** (misspelled) |
| FE-09 | `frontend_should_create_feedback_service` | [FE-09](frontend/FE-09-feedback-service.md) | ✅ Passing | `/api/feedback` singular |

---

## Suggested order of work

Frontend first — it is nine quick wins with no database involved, and it is fully independent of
the backend.

### Phase 1 — Frontend (clears 9/24)
1. Read [`01-frontend-foundation.md`](01-frontend-foundation.md).
2. Create all five models (FE-01 … FE-05) in one pass.
3. Create all four services (FE-06 … FE-09) in one pass. Watch the FE-08 filename.
4. Run Karma. Expect 9/9 — nothing else in `src/` has been touched yet.

### Phase 2 — Backend foundation (clears nothing on its own, unblocks everything)
5. Read [`00-shared-foundation.md`](00-shared-foundation.md).
6. F1 models → F2 repositories → F3 JWT/security config.

### Phase 3 — Auth (clears 4/24, unblocks 11)
7. BE-01, BE-02 (register) → BE-03, BE-04 (login).
8. **Verify the two tokens differ in their role claim before continuing.** Six later tests depend
   on it, and a role-blind token makes them fail for reasons that look unrelated.

### Phase 4 — Architect endpoints (clears 4/24)
9. BE-05, then BE-06 + BE-07 **together** (they conflict on URL matchers), then BE-08.

### Phase 5 — Inquiry endpoints (clears 4/24)
10. BE-09 → BE-10 → BE-11 → BE-12. Four different role rules under one `/api/inquiries` prefix;
    write them as explicit method-aware matchers in one sitting.

### Phase 6 — Feedback endpoints (clears 3/24)
11. BE-13 → BE-14 → BE-15.

### Phase 7 — Ungraded but required by the SRS
12. Angular components, routing, AuthGuard, error page; backend DELETE endpoints and the extra
    finder methods; the Phase-2 Gemini AI feature. None of this moves the score — do it after
    24/24, and re-run Karma afterwards since a broken component fails all nine frontend tests.

---

## Cross-cutting issues to keep in mind

1. **Reset `appdb` before every backend run.** The suite hard-codes generated ids (`userId` 1 and 2,
   `architectId` 1, `inquiryId` 1). With `spring.jpa.hibernate.ddl-auto=update` the second run keeps
   old rows, auto-increment advances, and BE-05 onward break with no code change. Use a clean
   database or `create-drop` while developing.
2. **Security must stay enabled.** SRS p.43 offers to comment security out or `permitAll()` the GET
   endpoints for auto-evaluation. That advice breaks BE-14 (and the whole 403 half of the suite).
   Ignore it.
3. **403 vs 401.** Every "forbidden" assertion sends a *valid* token with the *wrong* role. You only
   get 403 if the JWT filter authenticates the request first and authorization then rejects it. A
   filter that fails to populate the `SecurityContext` yields 401 everywhere.
4. **Matcher ordering decides four test pairs.** `/api/architects/{id}` vs `/api/architects`,
   `/api/inquiries/user/**` vs `/api/inquiries/**`, `/api/feedback/user/**` vs `/api/feedback/**`,
   and GET-vs-POST on the same collection paths. Always declare the more specific rule first.
5. **Never rename a graded file or exported symbol**, and don't delete anything in the workspace
   (SRS key point 5).
