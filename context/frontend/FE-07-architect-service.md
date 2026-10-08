# FE-07 — `frontend_should_create_architect_service`

**Status:** Failing · **File:** `angularapp/src/app/services/architect.service.ts` · **Export:** `ArchitectService`

## What the test does

```ts
TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
service = TestBed.inject(ArchitectService);
expect((service as any)).toBeTruthy();
```

## Why it fails today

`angularapp/src/app/services/` does not exist.

## What to implement

```ts
@Injectable({ providedIn: 'root' })
export class ArchitectService {
  public apiUrl = 'http://localhost:8080';
  constructor(private http: HttpClient) {}

  getAllArchitects()                                    // GET    /api/architects
  getArchitectById(architectId: number)                 // GET    /api/architects/:architectId
  addArchitect(architect: Architect)                    // POST   /api/architects
  updateArchitect(architectId: number, a: Architect)    // PUT    /api/architects/:architectId
  deleteArchitect(architectId: number)                  // DELETE /api/architects/:architectId
}
```

All five send `Authorization: Bearer <token>` from `localStorage` (SRS p.17–18).

## Files

**Create:** `angularapp/src/app/services/architect.service.ts`
**Depends on:** FE-03 (`Architect`) for the method signatures.

## Gotchas

- `providedIn: 'root'`, `HttpClient`-only constructor, no `localStorage` access in the constructor —
  same three rules as FE-06.
- Build the auth header **inside each method**, not as a field initialised at construction time. A
  field like `private headers = new HttpHeaders({Authorization: 'Bearer ' + localStorage.getItem('token')})`
  evaluates during `TestBed.inject`; it won't throw on a null token, but it captures a stale token
  for the app's whole lifetime — a real runtime bug even though the test passes.
- Method bodies are never executed by the test, but they must **type-check**. Returning
  `Observable<Architect[]>` etc. is fine.
- Remember the backend role split this service talks to: `getAllArchitects` works for both roles,
  everything else is Admin-only (see BE-05 … BE-08). Not graded here, but it shapes the components.

## Out of scope

HTTP verification, the admin add/edit/view-architect components, the user architect directory,
search/filter.

## Done when

The file exists at the exact path, exports a root-provided `ArchitectService`, and the app compiles.
