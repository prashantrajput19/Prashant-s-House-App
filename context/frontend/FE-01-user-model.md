# FE-01 — `frontend_User_model_should_create_an_instance`

**Status:** Failing · **File:** `angularapp/src/app/models/user.model.ts` · **Export:** `User`

## What the test does

```ts
import { User } from './user.model';

const user: User = {
  email: 'testuser@example.com', password: 'testpassword',
  username: 'testuser', mobileNumber: '1234567890', userRole: 'admin'
};
expect(user).toBeTruthy();
// each of email, password, username, mobileNumber, userRole toBeDefined()
```

## Why it fails today

`angularapp/src/app/models/` does not exist, so `karma.sh` prints `FAILED` without compiling.

## What to implement

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

## Files

**Create:** `angularapp/src/app/models/user.model.ts`
**Modify:** nothing.

## Gotchas

- **`userId` must be optional.** The spec's literal omits it; a required `userId: number` is a
  compile error that fails all nine Karma tests, not just this one.
- The spec passes `userRole: 'admin'` lowercase. Type it as `string`, not a
  `'Admin' | 'User'` union — the union would reject it.
- `mobileNumber` is a `string` (the SRS model confirms), not a number.
- The SRS shows this as `class User`. An `interface` is safer and satisfies the spec identically;
  a class with required constructor parameters would not accept the object literal.

## Out of scope

Validation rules, the signup form, any component that consumes `User`.

## Done when

The file exists at the exact path, exports `User`, and the app compiles.
