# FE-02 — `frontend_Login_model_should_create_an_instance`

**Status:** Failing · **File:** `angularapp/src/app/models/login.model.ts` · **Export:** `Login`

## What the test does

```ts
import { Login } from './login.model';
const login: Login = { email: 'abc', password: 'securepassword123' };
expect(login).toBeTruthy();
expect(login.email).toBeDefined();
expect(login.password).toBeDefined();
```

## Why it fails today

`angularapp/src/app/models/` does not exist.

## What to implement

```ts
export interface Login {
  email: string;
  password: string;
}
```

Two fields. Nothing else.

## Files

**Create:** `angularapp/src/app/models/login.model.ts`
**Modify:** nothing.

## Gotchas

- **Do not add `token` / `userRole` / `userId` here.** That is the backend's `LoginDTO` (the login
  *response*); this `Login` model is the login *request*. Adding required fields breaks the literal;
  the SRS p.14 confirms `Login` is email + password only.
- `email: 'abc'` is not a valid email — the type is just `string`, no branded/validated type.

## Out of scope

The login component, form validation, regex checks, storing the JWT.

## Done when

The file exists at the exact path, exports `Login` with exactly these two required fields.
