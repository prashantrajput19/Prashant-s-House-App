# BE-01 — `backend_testRegisterAdmin`

**Status:** Failing · **Order:** 1 · **Blocks:** BE-03, and transitively everything after it

## What the test does

POSTs to `/api/register` with no auth header:

```json
{ "userId": 1, "email": "demoadmin@gmail.com", "password": "admin@1234",
  "username": "admin123", "userRole": "Admin", "mobileNumber": "9876543210" }
```

Asserts **only** `HttpStatus.CREATED` (201). The response body is not inspected.

## Why it fails today

`/api/register` does not exist — there is no `controller/` folder. `User` is an empty class and
`UserRepo` is an empty interface, so there is nothing to persist to either.

## What to implement

1. **`User` model** — see Foundation F1. `userId` is `@Id @GeneratedValue(IDENTITY)`.
2. **`UserRepo extends JpaRepository<User, Long>`** with `Optional<User> findByEmail(String)`.
3. **`UserService.createUser(User user)`** → return type `void` per SRS. Impl saves via the repo.
   Hash the password with the `PasswordEncoder` bean here if you hash at all.
4. **`AuthController`** — `@RestController @RequestMapping("/api")`, method
   `@PostMapping("/register")` returning `ResponseEntity<...>` with
   `HttpStatus.CREATED`. Return the created `User` (SRS) — body is unchecked by this test.
5. **`SecurityConfig`** must `permitAll()` on `/api/register`, otherwise the unauthenticated POST
   is rejected with 401/403 before reaching the controller.

## Files

**Create:** `controller/AuthController.java`, `service/UserService.java`,
`service/UserServiceImpl.java`, `config/SecurityConfig.java` (+ the rest of Foundation F3)
**Modify:** `model/User.java`, `repository/UserRepo.java`

## Gotchas

- The request sends `"userId": 1` explicitly. With `GeneratedValue(IDENTITY)` Hibernate ignores it
  on insert — that is fine and expected, but it means the row only actually *gets* id 1 on a clean
  database. BE-09 later depends on the second user being `userId: 2`.
- Must return **201**, not 200. `@ResponseStatus(HttpStatus.CREATED)` or
  `ResponseEntity.status(HttpStatus.CREATED)`.
- On a re-run against a dirty `appdb` this email already exists. If you add duplicate-email handling
  that returns 409 (SRS allows it), the test fails on the second run. Reset the DB between runs.

## Out of scope

Login, JWT issuance, any role check (register is open to all), response-body shape, email/password
format validation.

## Done when

`POST /api/register` with the payload above returns 201 against an empty `appdb`.
