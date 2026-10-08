# STEP 06 — Register + Login endpoints

**Project:** ArchitectPoint — Spring Boot 3.0.1, package `com.examly.springapp`.
**Goal of this step:** implement `POST /api/register` and `POST /api/login` so backend tests
BE-01 … BE-04 pass.
**Prerequisites:** STEP-03, STEP-04, STEP-05.
**Clears:** 4 of 15 backend tests — and unblocks the other 11, which all read the tokens issued here.

## Context you need

The folders `service/` and `controller/` **do not exist** under
`springapp/src/main/java/com/examly/springapp/`. Create them.

This is the highest-leverage backend step. Tests run in `@Order` with `@TestInstance(PER_CLASS)`
and stash the two JWTs on the test instance:

```java
admintoken = objectMapper.readTree(response.getBody()).get("token").asText();
```

Every later test begins with `assertNotNull(admintoken)` / `assertNotNull(usertoken)`. If login
returns the wrong JSON shape, **11 additional tests fail** with errors that point nowhere near auth.

### What the tests send and expect

| Test | Request | Expected |
|---|---|---|
| BE-01 | POST `/api/register` `{userId:1, email:"demoadmin@gmail.com", password:"admin@1234", username:"admin123", userRole:"Admin", mobileNumber:"9876543210"}` | **201** |
| BE-02 | POST `/api/register` `{userId:2, email:"demouser@gmail.com", password:"user@1234", username:"user123", userRole:"User", mobileNumber:"1122334455"}` | **201** |
| BE-03 | POST `/api/login` `{email:"demoadmin@gmail.com", password:"admin@1234"}` | **200** + body with non-null `token` |
| BE-04 | POST `/api/login` `{email:"demouser@gmail.com", password:"user@1234"}` | **200** + body with non-null `token` |

Register response bodies are **not** inspected. Login response bodies are parsed for `token` only.

## Files to create

### 1. `service/UserService.java`

```java
public interface UserService {
    void createUser(User user);                 // SRS return type: void
    Optional<User> loginUser(User user);        // SRS return type
}
```

### 2. `service/UserServiceImpl.java`

```java
@Service
public class UserServiceImpl implements UserService {

    @Autowired private UserRepo userRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
    }

    @Override
    public Optional<User> loginUser(User user) {
        return userRepo.findByEmail(user.getEmail())
                .filter(found -> passwordEncoder.matches(user.getPassword(), found.getPassword()));
    }
}
```

**Encoding must be symmetric.** You hash on register, so you must compare with
`passwordEncoder.matches(raw, hashed)` on login. Hashing on one side and using `equals()` on the
other makes valid credentials fail — a wiring bug that looks like a credentials bug.

### 3. `controller/AuthController.java`

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserService userService;
    @Autowired private JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> found = userService.loginUser(loginRequest);

        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = found.get();
        LoginDTO dto = new LoginDTO();
        dto.setToken(jwtUtils.generateToken(user.getEmail(), user.getUserRole()));
        dto.setUsername(user.getUsername());
        dto.setUserRole(user.getUserRole());
        dto.setUserId(user.getUserId());

        return ResponseEntity.ok(dto);       // 200 + {"token": "...", ...}
    }
}
```

## Critical requirements

1. **Register must return 201**, not 200. `ResponseEntity.status(HttpStatus.CREATED)`.
2. **Login must return a JSON object whose key is exactly `token`.** Return the `LoginDTO`.
   Returning a bare token string, or naming the field `accessToken`/`jwt`, makes
   `body.get("token")` null → NPE in the test → BE-03/04 **and 11 downstream tests** fail.
3. **The login token must carry the user's real role** read from the database row
   (`user.getUserRole()`). Do not default it, infer it from the email, or hardcode it. Six later
   tests prove the wrong role is rejected with 403 — they all fail if both tokens are equivalent.
4. **The login request binds to `User`** with only `email` and `password` populated; the other
   fields are null. That is fine — do not require them.
5. `/api/register` and `/api/login` must be `permitAll()` in `SecurityConfig` (done in STEP-05).

## Constraints

- No `@PreAuthorize` anywhere — authorization lives in `SecurityConfig` (STEP-05).
- Do not add duplicate-email handling that returns 409. The SRS allows it, but it makes the suite
  fail on any re-run against a non-empty database. Keep register unconditional.
- Do not add bean validation (`@Valid`, `@Email`) to these endpoints.

## Verify before moving on

Reset the database first — the tests depend on `userId` 1 and 2 being freshly generated:

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
# password: examly
```

Then:

```bash
cd springapp && mvn -q test -Dtest=SpringappApplicationTests#backend_testRegisterAdmin+backend_testRegisterUser+backend_testLoginAdmin+backend_testLoginUser
```

Expect 4 passing. Then **manually confirm the two tokens differ in their role claim** — paste each
into jwt.io or decode the middle segment. One must carry `"role":"Admin"`, the other `"role":"User"`.

This 30-second check is worth doing: a role-blind token still passes BE-01…BE-04 and then fails six
later tests for reasons that look like controller bugs.
