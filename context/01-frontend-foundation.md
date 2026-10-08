# Frontend Foundation — read this before any Karma test case

All nine Karma tests (FE-01 … FE-09) are *existence* tests. None of them exercise behaviour: the
model specs build an object literal and assert its fields are defined; the service specs inject the
service and assert it is truthy. They are graded on **the file existing at an exact path**, **the
exported symbol having an exact name**, and **the whole app compiling**.

## How `karma/karma.sh` grades these — read this first

The runner does **not** just run Karma. For each test it first checks whether your source file
exists, and if not it prints `<test_name> FAILED` and never compiles anything:

```bash
if [ -e ".../angularapp/src/app/models/architect.model.ts" ]
then  cp karma/architect.model.spec.ts  .../src/app/models/architect.model.spec.ts
else  echo "frontend_Architect_model_should_create_an_instance FAILED"
fi
```

Consequences:

1. **The path must be exact.** `src/app/models/` and `src/app/services/` — not `src/app/model/`,
   not a nested feature folder.
2. **The spec is copied in next to your file and imports it by relative path** (`./architect.model`).
   The filename must match character-for-character.
3. **One compile error anywhere in `src/` fails all nine tests at once**, because Karma builds the
   whole app. A half-written component will take down passing model tests.
4. `karma.sh` also overwrites `angularapp/karma.conf.js` with `karma/karma.conf.js` on every run.
   Your local edit to `angularapp/karma.conf.js` (currently modified in git) is **discarded by the
   grader** — don't rely on it.
5. If `angularapp/` were missing entirely the script would copy the pristine one from
   `karma/angularapp/`. It exists, so your code is used.

## Required paths and exported names

| File to create | Must export | Graded by |
|---|---|---|
| `angularapp/src/app/models/user.model.ts` | `User` | FE-01 |
| `angularapp/src/app/models/login.model.ts` | `Login` | FE-02 |
| `angularapp/src/app/models/architect.model.ts` | `Architect` | FE-03 |
| `angularapp/src/app/models/architect-inquiry.model.ts` | `ArchitectInquiry` | FE-04 |
| `angularapp/src/app/models/feedback.model.ts` | `Feedback` | FE-05 |
| `angularapp/src/app/services/auth.service.ts` | `AuthService` | FE-06 |
| `angularapp/src/app/services/architect.service.ts` | `ArchitectService` | FE-07 |
| `angularapp/src/app/services/architect-inquery.service.ts` | `ArchitectInquiryService` | FE-08 |
| `angularapp/src/app/services/feedback.service.ts` | `FeedbackService` | FE-09 |

### The filename trap

The inquiry service file is **`architect-inquery.service.ts`** — "inqu**e**ry", misspelled — while
the exported class is **`ArchitectInquiryService`** — "inqu**i**ry", spelled correctly. The spec
does `import { ArchitectInquiryService } from './architect-inquery.service'`. The *model* file, by
contrast, uses the correct spelling (`architect-inquiry.model.ts`). Getting this backwards is the
most likely single cause of an FE-08 failure.

If you generate with the CLI, `npx ng g s services/architect-inquery` produces the right filename
but names the class `ArchitectInqueryService` — **rename the class** to `ArchitectInquiryService`
and leave the filename alone.

## Service shape (applies to FE-06 … FE-09)

Each service needs only:

```ts
@Injectable({ providedIn: 'root' })
export class XService {
  public apiUrl = 'http://localhost:8080';          // SRS: swap for your workspace :8080 URL
  constructor(private http: HttpClient) {}
  // methods per the API table
}
```

- `providedIn: 'root'` matters: the specs call `TestBed.inject(XService)` with only
  `HttpClientTestingModule` imported and **no `providers` array**. A service that isn't root-provided
  throws a NullInjectorError.
- `HttpClient` is the only safe constructor dependency. Injecting `Router`, or another service that
  pulls in `Router`, will fail — `RouterTestingModule` is not imported by these specs.
  `AuthService` injecting `HttpClient` only is fine; do the navigation in the component.
- Methods are not called by any test, but they must **type-check**. Write them per the SRS API table
  (p.16–18) so the components can use them.
- Auth header pattern used by every service except register/login:
  `new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') })`.

## Model shape

Plain `export interface` is the safest choice everywhere. The specs assign object literals, so TS
**excess-property checking** applies: any key present in the spec that is missing from your
interface is a compile error, and that error fails all nine tests. Conversely, a field the spec
omits must be **optional** (`?`).

## Out of scope for all nine Karma tests

- Every component (`login`, `signup`, `adminnav`, `usernav`, `home-page`, the admin/user screens,
  `error`), `authguard`, `app-routing.module.ts` route tables, CSS, and all template markup.
  The SRS requires them for the app to work; **no Karma test checks any of them.**
- Service method behaviour, HTTP call verification (`HttpTestingController.expectOne` is never used),
  interceptors, BehaviorSubject role/id state.
- `ai.service.ts` and `ai.model.ts` (Phase-2 Gemini feature, SRS p.45).
- `app.component.spec.ts` — ships with the project and is not in the graded list.

Build the components anyway for the running application, but **get all nine files above compiling
first** — they are the entire Karma score, and any broken component you add afterwards will silently
take them all down with it.
