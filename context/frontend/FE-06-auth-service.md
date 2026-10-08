# FE-06 — `frontend_should_create_auth_service`

**Status:** Failing · **File:** `angularapp/src/app/services/auth.service.ts` · **Export:** `AuthService`

## What the test does

```ts
TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
service = TestBed.inject(AuthService);
expect(service).toBeTruthy();
```

No `providers` array. No HTTP calls verified. Pure instantiation check.

## Why it fails today

`angularapp/src/app/services/` does not exist.

## What to implement

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  public apiUrl = 'http://localhost:8080';
  constructor(private http: HttpClient) {}

  register(user: User): Observable<any> { /* POST ${apiUrl}/api/register */ }
  login(login: Login): Observable<any> { /* POST ${apiUrl}/api/login */ }
}
```

Per SRS p.16/p.18: both endpoints take **no auth header**. `login()` additionally stores the JWT in
`localStorage` and updates role/id `BehaviorSubject`s.

## Files

**Create:** `angularapp/src/app/services/auth.service.ts`
**Depends on:** FE-01 (`User`) and FE-02 (`Login`) for the method signatures.

## Gotchas

- **`providedIn: 'root'` is mandatory.** The spec provides nothing, so a service registered only in
  `app.module.ts` `providers` would still resolve via the root injector — but one with no
  `providedIn` and no provider entry throws NullInjectorError.
- **Do not inject `Router`.** The spec imports only `HttpClientTestingModule`; there is no
  `RouterTestingModule`, so a `Router` dependency fails injection and this test goes red. Navigate
  from the login/logout components instead.
- **Keep `localStorage` work out of the constructor.** `TestBed.inject` runs it; a constructor that
  reads and `JSON.parse`s a missing key throws and fails instantiation. Initialise
  `BehaviorSubject`s with safe defaults and read storage lazily inside methods.
- The SRS lists `AuthService` twice (p.16 and p.18) with consistent details — one service, two
  methods.

## Out of scope

Actual HTTP behaviour (never asserted), the login/signup components, AuthGuard, logout flow,
token-expiry handling, role-based redirects.

## Done when

The file exists at the exact path, exports a root-provided `AuthService` that constructs with only
`HttpClient`, and the app compiles.
