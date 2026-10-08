# STEP 01 — Angular model interfaces

**Project:** ArchitectPoint — Angular 16 frontend in `angularapp/`, Spring Boot backend in `springapp/`.
**Goal of this step:** create five TypeScript model files so the Karma tests FE-01…FE-05 pass.
**Prerequisites:** none.

## Context you need

The folder `angularapp/src/app/models/` **does not exist yet**. Create it.

The grader (`karma/karma.sh`) checks each model file exists at an exact path, copies a `.spec.ts`
next to it, then runs Karma over the whole app. Two consequences:

- A wrong path or filename means the test prints `FAILED` without compiling anything.
- **One TypeScript error anywhere fails all nine frontend tests**, so these interfaces must accept
  the spec object literals exactly — no missing fields (excess-property error) and no
  extra-required fields (missing-property error).

## Files to create

All under `angularapp/src/app/models/`:

### 1. `user.model.ts`

```ts
export interface User {
  userId?: number;
  email: string;
  password: string;
  username: string;
  mobileNumber: string;
  userRole: string;
}
```

`userId` **must** be optional — the spec's literal omits it.
`userRole` **must** be `string`, not a `'Admin' | 'User'` union — the spec passes `'admin'`.

### 2. `login.model.ts`

```ts
export interface Login {
  email: string;
  password: string;
}
```

Exactly two fields. Do **not** add `token`/`userRole`/`userId` — that is the backend's `LoginDTO`
(the login *response*), not this request model.

### 3. `architect.model.ts`

```ts
export interface Architect {
  architectId?: number;
  name: string;
  expertise: string;
  location: string;
  rating: number;
  portfolioLink: string;
  status: string;
}
```

### 4. `architect-inquiry.model.ts`

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

**The SRS version of this interface is wrong — do not copy it.** The SRS omits `status`,
`inquiryDate` and `responseDate`, but the spec assigns all three. Omitting them is a TypeScript
excess-property error that fails all nine frontend tests.

`user` and `architect` must be `Partial<...>`, not narrow id-only shapes: the spec passes
`{ architectId: 456, name: 'John Architect' }` — two keys.

Note this file uses the **correct** spelling `inquiry`. The *service* file in STEP-02 is
deliberately misspelled `inquery`. They differ.

### 5. `feedback.model.ts`

```ts
export interface Feedback {
  feedbackId?: number;
  feedbackText: string;
  date: string;
  user: { userId: number };
  architect?: { architectId: number };
  category: string;
}
```

`date` is a **`string`** (ISO 8601), not a `Date`.

## Constraints

- Use `export interface`, not `class`. A class with a required constructor would reject the spec's
  object literals.
- Do not create `index.ts` barrel files — the specs import by direct relative path.
- Do not create any component or touch `app.module.ts` in this step.

## Verify before moving on

```bash
cd angularapp && npx tsc --noEmit -p tsconfig.json
```

Expect no errors. Confirm all five files exist:

```bash
ls angularapp/src/app/models/
# architect-inquiry.model.ts  architect.model.ts  feedback.model.ts
# login.model.ts  user.model.ts
```

Full Karma verification happens in STEP-10 (models and services are graded together, and the
service files from STEP-02 must exist first or four tests still report FAILED).
