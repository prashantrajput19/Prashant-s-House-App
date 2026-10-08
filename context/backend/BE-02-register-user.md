# BE-02 — `backend_testRegisterUser`

**Status:** Failing · **Order:** 2 · **Blocks:** BE-04, BE-09, BE-11, BE-13, BE-15

## What the test does

Identical to BE-01 but with the `User` role:

```json
{ "userId": 2, "email": "demouser@gmail.com", "password": "user@1234",
  "username": "user123", "userRole": "User", "mobileNumber": "1122334455" }
```

Asserts **201 CREATED** only.

## Why it fails today

Same root cause as BE-01 — no `/api/register` endpoint exists.

## What to implement

**Nothing beyond BE-01.** Once `POST /api/register` works, this test passes with no extra code.
The only new requirement it introduces is that `userRole` must round-trip the literal string
`"User"` into the stored row, because BE-04's login has to issue a `User`-role token from it.

## Files

Same as BE-01. No additional files.

## Gotchas

- **This user must land on `userId == 2`.** BE-09 posts an inquiry with `"user": {"userId": 2}`
  and BE-11/BE-15 fetch `/user/2`. That only happens if BE-01's admin took id 1 on a clean
  auto-increment. This is the single strongest argument for resetting `appdb` before each run.
- Do not normalise, lowercase, or map `userRole`. Store `"User"` verbatim — your JWT authority
  mapping (`ROLE_User`) and every later 403 assertion depend on the exact casing.

## Out of scope

Everything listed in BE-01, plus any notion of a default role — the role always arrives in the body.

## Done when

Both registrations succeed in sequence against an empty DB, producing rows with `userId` 1 and 2.
