# STEP 03 — Backend JPA entities and DTO

**Project:** ArchitectPoint — Spring Boot 3.0.1, Java 17, MySQL (`appdb`), package `com.examly.springapp`.
**Goal of this step:** fill in the five empty model classes so entities persist and serialise correctly.
**Prerequisites:** none.

## Context you need

These five files **already exist** at
`springapp/src/main/java/com/examly/springapp/model/` but every one of them is an empty class body:

```java
package com.examly.springapp.model;
public class Architect {
}
```

Fill them in. Do not create new files, do not rename, do not delete.

**Spring Boot 3 ⇒ use `jakarta.persistence.*`, never `javax.persistence.*`.** This is the single
most common compile failure on this stack.

Field names are graded — the JUnit suite asserts on JSON keys like `architectId`, `portfolioLink`,
`feedbackText`. Do not rename or snake_case anything.

Every class needs a **no-arg constructor** plus **standard getters and setters for every field**
(Jackson needs both directions). An all-args constructor is optional.

## Files to modify

### 1. `model/User.java`

```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String username;
    private String mobileNumber;
    private String userRole;   // "Admin" or "User" — store verbatim, never normalise case
}
```

`@JsonProperty(access = WRITE_ONLY)` on `password` lets it deserialise from register/login requests
but keeps it out of every response — including the nested `user` object inside inquiries and
feedback. Nothing in the test suite reads a password back.

### 2. `model/Architect.java`

```java
@Entity
public class Architect {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long architectId;

    private String name;
    private String expertise;     // e.g. "Residential", "Commercial"
    private String location;
    private Double rating;        // Double, not Integer — payloads send 4.5 / 4.8
    private String portfolioLink;
    private String status;        // "Active" / "Inactive"
}
```

### 3. `model/ArchitectInquiry.java`

```java
@Entity
public class ArchitectInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inquiryId;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "architectId", nullable = false)
    private Architect architect;

    private String message;
    private String status;          // "Pending" / "Resolved" / "Closed"
    private String priority;        // "Low" / "Medium" / "High"
    private String contactDetails;
}
```

Keep both relations **unidirectional** — do not add a `List<ArchitectInquiry>` back-reference on
`User` or `Architect`. A bidirectional pair without `@JsonIgnore` causes infinite recursion during
serialisation, which turns a 201 into a 500.

### 4. `model/Feedback.java`

```java
@Entity
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackId;

    private String feedbackText;

    private String date;            // String (ISO), NOT LocalDate — payload sends "2025-02-27"

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "architectId", nullable = true)
    private Architect architect;    // nullable per SRS

    private String category;        // "Service" / "Pricing" / "Quality"
}
```

### 5. `model/LoginDTO.java`

**Not an entity.** Plain POJO — no `@Entity`, no `@Id`, no annotations at all.

```java
public class LoginDTO {
    private String token;
    private String username;
    private String userRole;
    private Long userId;
}
```

This is the login *response* body. The JUnit test reads `responseBody.get("token")`, so the field
must be named exactly `token` and must have a public getter.

## Constraints

- `jakarta.persistence.*` imports only.
- No Lombok — it is not in `pom.xml`. Write the accessors out.
- Do not add `@Table(name = ...)` overrides; default table names are fine.
- Do not add validation annotations in this step (`@NotNull`, `@Email`) — they can reject the test
  payloads in ways the suite does not expect.

## Verify before moving on

```bash
cd springapp && mvn -q compile
```

Expect a clean compile. Nothing is runnable yet — repositories come next in STEP-04.
