# STEP 04 — Spring Data repositories

**Project:** ArchitectPoint — Spring Boot 3.0.1, package `com.examly.springapp`.
**Goal of this step:** turn the four empty repository interfaces into working `JpaRepository`s with
the derived queries the services need.
**Prerequisites:** STEP-03 (the entities).

## Context you need

These four files **already exist** at
`springapp/src/main/java/com/examly/springapp/repository/` but each is an empty interface that does
not extend anything:

```java
package com.examly.springapp.repository;
public interface UserRepo {
}
```

Modify them in place. Do not create, rename or delete files.

## Files to modify

### 1. `repository/UserRepo.java`

```java
@Repository
public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

`findByEmail` backs both login (STEP-06) and the `UserDetailsService` (STEP-05).

### 2. `repository/ArchitectRepo.java`

```java
@Repository
public interface ArchitectRepo extends JpaRepository<Architect, Long> {
}
```

No custom finders needed for the graded tests. (The SRS also describes
`getArchitectsByExpertise/Status/Location` and `searchArchitects` — those are ungraded, deferred to
STEP-11.)

### 3. `repository/ArchitectInquiryRepo.java`

```java
@Repository
public interface ArchitectInquiryRepo extends JpaRepository<ArchitectInquiry, Long> {
    List<ArchitectInquiry> findByUserUserId(Long userId);
}
```

`findByUserUserId` traverses the `user` relation to its `userId` field. `findByUser_UserId` (with
an explicit underscore) is equivalent and also valid — use either, but the property path must
resolve or the application fails at startup with a `PropertyReferenceException`.

### 4. `repository/FeedbackRepo.java`

```java
@Repository
public interface FeedbackRepo extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserUserId(Long userId);
}
```

## Constraints

- Import the entities from `com.examly.springapp.model`.
- `@Repository` is optional on a `JpaRepository` sub-interface but harmless — include it for
  clarity.
- Do not write `@Query` JPQL for any of these; the derived names are sufficient.
- Do not add paging/sorting variants — the tests expect bare JSON arrays.

## Verify before moving on

```bash
cd springapp && mvn -q compile
```

Expect a clean compile. A derived-query typo won't surface until the Spring context starts, which
first happens in STEP-06 — if the app later fails to boot with `PropertyReferenceException`, the
cause is a method name here.
