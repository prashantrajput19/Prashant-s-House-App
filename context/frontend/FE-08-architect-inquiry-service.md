# FE-08 — `frontend_should_create_architect_inquiry_service`

**Status:** Failing · **File:** `angularapp/src/app/services/architect-inquery.service.ts` · **Export:** `ArchitectInquiryService`

> **The filename is deliberately misspelled. Read the first gotcha before writing anything.**

## What the test does

```ts
import { ArchitectInquiryService } from './architect-inquery.service';
...
service = TestBed.inject(ArchitectInquiryService);
expect((service as any)).toBeTruthy();
```

## Why it fails today

`angularapp/src/app/services/` does not exist.

## What to implement

```ts
// file: services/architect-inquery.service.ts   ← "inquery"
@Injectable({ providedIn: 'root' })
export class ArchitectInquiryService {           // ← "Inquiry"
  public apiUrl = 'http://localhost:8080';
  constructor(private http: HttpClient) {}

  addInquiry(inquiry: ArchitectInquiry)                 // POST   /api/inquiries
  getAllInquiries()                                     // GET    /api/inquiries
  getInquiriesByUserId(userId: number)                  // GET    /api/inquiries/user/:userId
  updateInquiry(inquiryId: number, i: ArchitectInquiry) // PUT    /api/inquiries/:inquiryId
  deleteInquiry(inquiryId: number)                      // DELETE /api/inquiries/:inquiryId
}
```

All five send `Authorization: Bearer <token>` (SRS p.16–17).

## Files

**Create:** `angularapp/src/app/services/architect-inquery.service.ts`
**Depends on:** FE-04 (`ArchitectInquiry`).

## Gotchas

- **Filename `architect-inquery.service.ts` ("inqu*e*ry"), class `ArchitectInquiryService`
  ("Inqu*i*ry").** This mismatch is baked into both the spec's import path and the `karma.sh`
  existence check:
  ```bash
  if [ -e ".../services/architect-inquery.service.ts" ] ... else echo "...FAILED"
  ```
  Name the file correctly-spelled and the grader never even compiles — it just prints FAILED.
  Note the *model* file (FE-04) uses the correct spelling `architect-inquiry.model.ts`.
- If you scaffold with `npx ng g s services/architect-inquery`, the CLI generates the right filename
  but class `ArchitectInqueryService`. **Rename the class, keep the filename.**
- Same three service rules as FE-06: `providedIn: 'root'`, `HttpClient`-only constructor, no
  `localStorage` in the constructor.
- Backend role split this service hits: `addInquiry` is User-only, `getAllInquiries` is Admin-only,
  `getInquiriesByUserId` is User-only, `updateInquiry` is Admin-only (BE-09 … BE-12). The SRS
  labels `deleteInquiry` "Admin only" in the service notes but the API table says User — neither is
  tested.

## Out of scope

HTTP verification, the add-inquiry form, My-Inquiries table, the admin inquiry console.

## Done when

A file named exactly `architect-inquery.service.ts` exists under `src/app/services/`, exports
`ArchitectInquiryService`, and the app compiles.
