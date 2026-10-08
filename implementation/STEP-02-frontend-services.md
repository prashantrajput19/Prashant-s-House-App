# STEP 02 — Angular services

**Project:** ArchitectPoint — Angular 16 frontend in `angularapp/`, Spring Boot backend on port 8080.
**Goal of this step:** create four Angular services so the Karma tests FE-06…FE-09 pass.
**Prerequisites:** STEP-01 (the model interfaces these import).

## Context you need

The folder `angularapp/src/app/services/` **does not exist yet**. Create it.

Each spec does only this:

```ts
TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
service = TestBed.inject(SomeService);
expect(service).toBeTruthy();
```

There is **no `providers` array and no `RouterTestingModule`**. That dictates three hard rules for
every service below:

1. **`@Injectable({ providedIn: 'root' })`** — otherwise `TestBed.inject` throws NullInjectorError.
2. **`HttpClient` is the only constructor dependency.** Injecting `Router` (or anything that pulls
   it in) fails injection and the test goes red.
3. **No `localStorage` access in the constructor or in field initialisers.** It runs during
   `TestBed.inject`; a throw there fails instantiation, and a field-initialised auth header also
   captures a stale token for the app's lifetime. Build headers inside each method.

Method bodies are never executed by the tests, but the whole app must compile.

## ⚠️ The filename trap — read before creating files

The inquiry service file is **`architect-inquery.service.ts`** — "inqu**e**ry", misspelled — while
the exported class is **`ArchitectInquiryService`** — "inqu**i**ry", correct. The spec does:

```ts
import { ArchitectInquiryService } from './architect-inquery.service';
```

and `karma.sh` checks for that exact misspelled filename. Get it right or FE-08 fails without
compiling. (The *model* file from STEP-01 uses the correct spelling — they genuinely differ.)

If you scaffold with `npx ng g s services/architect-inquery`, the CLI produces the right filename
but names the class `ArchitectInqueryService`. **Rename the class, keep the filename.**

## Shared pattern

```ts
public apiUrl = 'http://localhost:8080';

private authHeaders(): HttpHeaders {
  return new HttpHeaders({
    Authorization: 'Bearer ' + (localStorage.getItem('token') ?? '')
  });
}
```

Per SRS: `apiUrl` is a **public** property; replace `localhost` with the workspace port-8080 URL
when deploying. Every endpoint except register/login sends the Bearer header.

## Files to create

All under `angularapp/src/app/services/`:

### 1. `auth.service.ts` — `AuthService`

No auth header on either method.

| Method | Request |
|---|---|
| `register(user: User): Observable<any>` | POST `${apiUrl}/api/register`, body `user` |
| `login(login: Login): Observable<any>` | POST `${apiUrl}/api/login`, body `login` |

`login()` should also store the returned JWT in `localStorage` and update role/id
`BehaviorSubject`s (SRS p.16) — do that inside a `tap(...)`, and initialise the subjects with safe
defaults (`new BehaviorSubject<string | null>(null)`), **not** by reading `localStorage` at
construction time.

### 2. `architect.service.ts` — `ArchitectService`

All five send the Bearer header.

| Method | Request |
|---|---|
| `getAllArchitects()` | GET `${apiUrl}/api/architects` |
| `getArchitectById(architectId: number)` | GET `${apiUrl}/api/architects/${architectId}` |
| `addArchitect(architect: Architect)` | POST `${apiUrl}/api/architects` |
| `updateArchitect(architectId: number, architect: Architect)` | PUT `${apiUrl}/api/architects/${architectId}` |
| `deleteArchitect(architectId: number)` | DELETE `${apiUrl}/api/architects/${architectId}` |

### 3. `architect-inquery.service.ts` — `ArchitectInquiryService`

Misspelled filename, correctly spelled class. All five send the Bearer header.

| Method | Request |
|---|---|
| `addInquiry(inquiry: ArchitectInquiry)` | POST `${apiUrl}/api/inquiries` |
| `getAllInquiries()` | GET `${apiUrl}/api/inquiries` |
| `getInquiriesByUserId(userId: number)` | GET `${apiUrl}/api/inquiries/user/${userId}` |
| `updateInquiry(inquiryId: number, inquiry: ArchitectInquiry)` | PUT `${apiUrl}/api/inquiries/${inquiryId}` |
| `deleteInquiry(inquiryId: number)` | DELETE `${apiUrl}/api/inquiries/${inquiryId}` |

### 4. `feedback.service.ts` — `FeedbackService`

Endpoint is `/api/feedback` — **singular** — in all four. All send the Bearer header.
Method names are from SRS p.17; keep them verbatim.

| Method | Request |
|---|---|
| `sendFeedback(feedback: Feedback)` | POST `${apiUrl}/api/feedback` |
| `getAllFeedbacksByUserId(userId: number)` | GET `${apiUrl}/api/feedback/user/${userId}` |
| `deleteFeedback(feedbackId: number)` | DELETE `${apiUrl}/api/feedback/${feedbackId}` |
| `getFeedbacks()` | GET `${apiUrl}/api/feedback` |

## Constraints

- Do not create components, routes, or an AuthGuard in this step. A broken component fails all nine
  frontend tests.
- Do not add an `HttpInterceptor` — not needed, and it adds an injection path the specs don't set up.
- Import the models from STEP-01 by relative path (`../models/user.model`).

## Verify before moving on

```bash
cd angularapp && npx tsc --noEmit -p tsconfig.json
ls angularapp/src/app/services/
# architect-inquery.service.ts  architect.service.ts
# auth.service.ts               feedback.service.ts
```

Confirm the misspelling is present in the filename and absent from the class name:

```bash
grep -n "export class" angularapp/src/app/services/architect-inquery.service.ts
# expected: export class ArchitectInquiryService {
```

Then run the frontend suite:

```bash
cd angularapp && npm test
```

Expect **9/9 passing** (FE-01…FE-09). If any report `FAILED` without a compile error in the log,
it is a filename/path mismatch, not a code bug.
