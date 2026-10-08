# STEP 05 — JWT authentication + Spring Security 6 config

**Project:** ArchitectPoint — Spring Boot 3.0.1, Spring Security 6, `jjwt 0.9.1`, package `com.examly.springapp`.
**Goal of this step:** build the whole `config/` package so that a Bearer token authenticates a
request and the user's role is enforced per endpoint.
**Prerequisites:** STEP-03 (entities), STEP-04 (repositories).

## Context you need

The folder `springapp/src/main/java/com/examly/springapp/config/` **does not exist**. Create it
with seven classes (names fixed by SRS p.9).

**This is the highest-risk step in the project.** 11 of the 15 backend tests assert a specific
403/200 split by role. They only pass if:

- the JWT filter successfully authenticates the request (populates `SecurityContext`), **and**
- the authorization rule then rejects the wrong role.

If the filter fails to authenticate, you get **401** everywhere instead of 403 and most of the
suite fails for a reason that looks unrelated to security.

`pom.xml` already has `spring-boot-starter-security`, `jjwt 0.9.1` and `jaxb-api`. **Do not modify
`pom.xml`.**

### Role mapping

Users register with `userRole` = `"Admin"` or `"User"` (exact casing). Map to Spring authorities by
prefixing `ROLE_`:

| `userRole` in DB | Granted authority | Checked with |
|---|---|---|
| `Admin` | `ROLE_Admin` | `hasRole("Admin")` |
| `User` | `ROLE_User` | `hasRole("User")` |

`hasRole("X")` adds the `ROLE_` prefix automatically — never write `hasRole("ROLE_Admin")`.

## Files to create

All under `springapp/src/main/java/com/examly/springapp/config/`.

### 1. `UserPrinciple.java`

Implements `org.springframework.security.core.userdetails.UserDetails`, wrapping the `User` entity.

```java
public class UserPrinciple implements UserDetails {
    private final User user;

    public UserPrinciple(User user) { this.user = user; }

    public User getUser() { return user; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserRole()));
    }

    @Override public String getPassword() { return user.getPassword(); }
    @Override public String getUsername() { return user.getEmail(); }  // email is the principal
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}
```

### 2. `MyUserDetailsService.java`

```java
@Service
public class MyUserDetailsService implements UserDetailsService {
    @Autowired private UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return new UserPrinciple(user);
    }
}
```

### 3. `JwtUtils.java`

Uses the jjwt 0.9.1 API (`signWith(SignatureAlgorithm, String)`).

```java
@Component
public class JwtUtils {
    private static final String SECRET = "architectPointSecretKeyForJwtSigning2025";
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000L;   // 24h

    public String generateToken(String email, String userRole) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userRole);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser().setSigningKey(SECRET)
                   .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

### 4. `JwtAuthenticationEntryPoint.java`

Returns 401 for *unauthenticated* requests (no/invalid token).

```java
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }
}
```

Imports are `jakarta.servlet.http.*`.

### 5. `JwtAuthenticationFilter.java`

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired private JwtUtils jwtUtils;
    @Autowired private MyUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                if (jwtUtils.validateToken(token)) {
                    String email = jwtUtils.extractUsername(token);
                    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

**Never throw out of this filter** — always call `filterChain.doFilter`. A filter that aborts on a
bad token produces 500s instead of 401/403.

### 6. `CrosConfig.java`

Note the SRS's spelling — `CrosConfig`, not `CorsConfig`.

```java
@Configuration
public class CrosConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

### 7. `SecurityConfig.java` — the critical file

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired private JwtAuthenticationFilter jwtAuthenticationFilter;
    @Autowired private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          .csrf(csrf -> csrf.disable())
          .cors(cors -> {})
          .exceptionHandling(e -> e.authenticationEntryPoint(jwtAuthenticationEntryPoint))
          .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .authorizeHttpRequests(auth -> auth

              // ---- public ----
              .requestMatchers("/api/register", "/api/login").permitAll()

              // ---- architects ----
              .requestMatchers(HttpMethod.POST,   "/api/architects").hasRole("Admin")
              .requestMatchers(HttpMethod.GET,    "/api/architects").authenticated()  // BOTH roles
              .requestMatchers(HttpMethod.GET,    "/api/architects/*").hasRole("Admin")
              .requestMatchers(HttpMethod.PUT,    "/api/architects/*").hasRole("Admin")
              .requestMatchers(HttpMethod.DELETE, "/api/architects/*").hasRole("Admin")

              // ---- inquiries (most specific first) ----
              .requestMatchers(HttpMethod.GET,    "/api/inquiries/user/*").hasRole("User")
              .requestMatchers(HttpMethod.POST,   "/api/inquiries").hasRole("User")
              .requestMatchers(HttpMethod.GET,    "/api/inquiries").hasRole("Admin")
              .requestMatchers(HttpMethod.PUT,    "/api/inquiries/*").hasRole("Admin")
              .requestMatchers(HttpMethod.DELETE, "/api/inquiries/*").hasRole("User")
              .requestMatchers(HttpMethod.GET,    "/api/inquiries/*").authenticated()

              // ---- feedback (singular path, most specific first) ----
              .requestMatchers(HttpMethod.GET,    "/api/feedback/user/*").hasRole("User")
              .requestMatchers(HttpMethod.POST,   "/api/feedback").hasRole("User")
              .requestMatchers(HttpMethod.GET,    "/api/feedback").hasRole("Admin")
              .requestMatchers(HttpMethod.DELETE, "/api/feedback/*").hasRole("User")
              .requestMatchers(HttpMethod.GET,    "/api/feedback/*").authenticated()

              .anyRequest().authenticated())
          .addFilterBefore(jwtAuthenticationFilter,
                           UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

## Why the matchers are written this way — do not "simplify" them

1. **Single `*`, never `**`.** `/api/architects/*` matches exactly one extra segment, so it cannot
   swallow the bare collection path `/api/architects`. Writing `/api/architects/**` instead would
   match both and break the Admin-vs-both-roles split between those two endpoints.
2. **Every rule is method-aware.** Three different paths carry *opposite* roles per HTTP method:
   `POST /api/inquiries` is User-only while `GET /api/inquiries` is Admin-only; same for
   `/api/feedback`. A matcher without an `HttpMethod` argument breaks one side of each pair.
3. **`/user/*` rules come first.** `GET /api/inquiries/user/2` must hit the User rule, not a
   broader inquiry rule. Spring Security applies the **first** matching rule.
4. **`GET /api/architects` is `authenticated()`, not `permitAll()`.** Both roles must get 200, but
   a token is still required.

## ⚠️ Ignore SRS p.43 on security

The SRS says that for auto-evaluation you may comment out all security files and the security
dependency, or put `GET /api/architects` and `GET /api/feedback` in `permitAll()`.

**Do not do either.** The graded suite requires `GET /api/feedback` to return **403** for a User,
and requires real role enforcement on eight other endpoints. Disabling security fails the majority
of the suite.

## Constraints

- Spring Security 6 lambda DSL only — `WebSecurityConfigurerAdapter` was removed and will not compile.
- `jakarta.servlet.*` imports, not `javax.servlet.*`.
- Use **either** these URL matchers **or** `@PreAuthorize` on controller methods — not both. This
  plan uses URL matchers throughout; STEP-06 to 09 assume that and add no method-level annotations.
- Do not modify `pom.xml`.

## Verify before moving on

```bash
cd springapp && mvn -q compile
```

Clean compile expected. The context does not start until STEP-06 adds a controller; a
`PropertyReferenceException` or bean-wiring error at that point usually traces back to this step
or STEP-04.
