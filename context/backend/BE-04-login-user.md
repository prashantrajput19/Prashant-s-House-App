# BE-04 — `backend_testLoginUser`

**Status:** Failing · **Order:** 4 · **Blocks:** BE-05 … BE-15 (every test asserts `usertoken != null`)

## What the test does

```java
POST /api/login   {"email": "demouser@gmail.com", "password": "user@1234"}
usertoken = objectMapper.readTree(response.getBody()).get("token").asText();
assertEquals(HttpStatus.OK, ...); assertNotNull(token);
```

Note: unlike BE-03 there is no `assertNotNull(getBody())` guard, so a null body throws inside
`readTree` instead.

## Why it fails today

Same as BE-03 — no `/api/login`.

## What to implement

**Nothing beyond BE-03**, with one critical addition: the token issued here must carry the
**`User`** role, not `Admin`. Read `userRole` off the persisted user row and put it in the claim.

Every "forbidden" assertion in the suite (BE-05, BE-06, BE-08, BE-10, BE-12, BE-14) works by sending
*this* token at an Admin-only endpoint and expecting 403. If both logins mint identically-privileged
tokens, those tests fail even though the endpoints are correct.

## Files

Same as BE-03. No additional files.

## Gotchas

- Do not derive the role from the email, a hardcoded default, or request order. Read it from the DB.
- Verify the two tokens actually differ in their role claim before moving on — decode them once by
  hand. A role-blind token is the most expensive bug in this suite because it produces six
  *unrelated-looking* failures downstream.

## Out of scope

Same as BE-03.

## Done when

Login as `demouser@gmail.com` returns 200 with a `token` whose role claim resolves to `User`.
