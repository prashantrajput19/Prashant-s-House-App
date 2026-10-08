# BE-03 — `backend_testLoginAdmin`

**Status:** Failing · **Order:** 3 · **Blocks:** BE-05 … BE-15 (every test asserts `admintoken != null`)

## What the test does

```java
POST /api/login   {"email": "demoadmin@gmail.com", "password": "admin@1234"}

assertNotNull(response.getBody(), "Response body is null!");
JsonNode body = objectMapper.readTree(response.getBody());
String token = body.get("token").asText();   // ← key must literally be "token"
admintoken = token;
assertEquals(HttpStatus.OK, response.getStatusCode());
assertNotNull(token);
```

The token is stored on the test instance and reused by all 11 later tests.

## Why it fails today

No `/api/login` endpoint, no JWT utility classes, no `config/` folder.

## What to implement

1. **`LoginDTO`** — plain POJO with `token`, `username`, `userRole`, `userId`. Not an `@Entity`.
2. **`JwtUtils`** (`config/`) — generate a signed token. Embed the user's role as a claim; you will
   read it back in the filter to build the authority. Use the `jjwt 0.9.1` API already in `pom.xml`
   (`Jwts.builder()...signWith(SignatureAlgorithm.HS256, secret).compact()`).
3. **`UserService.loginUser(User user)`** → `Optional<User>` per SRS. Look up by email, compare the
   password (via `PasswordEncoder.matches` if you hashed on register).
4. **`AuthController.login`** — `@PostMapping("/login")`. On success build a `LoginDTO` with the
   generated token and return **200 OK**. On bad credentials return 401/403 (untested).
5. **`SecurityConfig`** must `permitAll()` on `/api/login`.

## Files

**Create:** `config/JwtUtils.java`, `config/JwtAuthenticationFilter.java`,
`config/MyUserDetailsService.java`, `config/UserPrinciple.java`,
`config/JwtAuthenticationEntryPoint.java`
**Modify:** `model/LoginDTO.java`, `controller/AuthController.java`,
`service/UserService.java` + `UserServiceImpl.java`, `config/SecurityConfig.java`

## Gotchas

- **The JSON key must be exactly `token`.** `accessToken`, `jwt`, or a bare string body all cause
  `body.get("token")` to return null → `NullPointerException` → this test *and* the 11 downstream
  tests fail. Returning the `LoginDTO` object directly handles this.
- The login request body has only `email` and `password`. If you bind it to the `User` entity the
  other fields are simply null — fine. Do not require a non-null `userRole` on the way in.
- **Password encoding must be symmetric with register.** Hashing on register but comparing with
  `equals()` on login (or vice versa) makes login fail for valid credentials, which looks like a
  credentials bug but is a wiring bug.
- `assertNotNull(response.getBody())` fires before the status check, so even a 401 with an empty
  body fails here with a confusing message.

## Out of scope

Token expiry/refresh semantics, logout, remember-me, the `username`/`userRole`/`userId` values in
the DTO (unchecked by this test, though the frontend uses them).

## Done when

Login returns 200 with a JSON body containing a non-empty `token` field.
