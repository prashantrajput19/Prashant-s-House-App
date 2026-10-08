# FE-04 — `frontend_Architect_Inquiry_model_should_create_an_instance`

**Status:** Failing · **File:** `angularapp/src/app/models/architect-inquiry.model.ts` · **Export:** `ArchitectInquiry`

> This is the one model where **the SRS is wrong** and the spec is right. Read the gotchas.

## What the test does

```ts
const architectInquiry: ArchitectInquiry = {
  inquiryId: 1,
  user: { userId: 123 },
  architect: { architectId: 456, name: 'John Architect' },
  message: 'What are your rates for residential projects?',
  status: 'Pending',
  inquiryDate: '2025-01-22T10:00:00.000Z',
  responseDate: '2025-01-23T10:00:00.000Z',
  priority: 'High',
  contactDetails: 'jane.doe@example.com'
};
// message, priority, user, architect, status, inquiryDate, responseDate, contactDetails
// each toBeDefined()
```

## Why it fails today

`angularapp/src/app/models/` does not exist.

## What to implement

```ts
import { User } from './user.model';
import { Architect } from './architect.model';

export interface ArchitectInquiry {
  inquiryId?: number;
  user: Partial<User>;
  architect: Partial<Architect>;
  message: string;
  status?: string;
  inquiryDate?: string;
  responseDate?: string;
  priority: string;
  contactDetails?: string;
}
```

## Files

**Create:** `angularapp/src/app/models/architect-inquiry.model.ts`
**Depends on:** FE-01 (`user.model.ts`) and FE-03 (`architect.model.ts`) must exist for the imports.

## Gotchas

- **The SRS interface (p.15) is missing three fields the spec requires:** `status`, `inquiryDate`,
  and `responseDate`. If you copy the SRS verbatim, TypeScript's excess-property check rejects the
  spec's object literal and **all nine Karma tests fail**, not just this one. Add all three.
- Declare the three extras as **optional** (`?`). The spec assigns them, so optional satisfies
  `toBeDefined()`; making them required would be stricter than the app needs when creating a new
  inquiry.
- **`Partial<User>` / `Partial<Architect>` are required, not plain id objects.** The spec passes
  `{ architectId: 456, name: 'John Architect' }` — two fields. A narrow
  `architect: { architectId: number }` type rejects the extra `name` key. `Partial<Architect>`
  accepts any subset.
- The filename here uses the **correct** spelling `architect-inquiry.model.ts`. The *service* file
  (FE-08) uses the misspelled `architect-inquery.service.ts`. They differ on purpose — see
  `01-frontend-foundation.md`.
- `inquiryDate` / `responseDate` are `string` (ISO), not `Date`.
- These two date fields do **not** exist on the backend `ArchitectInquiry` entity and no backend
  test references them. They are frontend-only; don't add columns for them.

## Out of scope

The add-inquiry form, the My-Inquiries table, status filtering, `ArchitectInquiryService` (FE-08).

## Done when

The file exists at the exact path, exports `ArchitectInquiry` accepting all nine keys above, and
the app compiles.
