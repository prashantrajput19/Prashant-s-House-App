# STEP 09 — Feedback endpoints

**Project:** ArchitectPoint — Spring Boot 3.0.1, package `com.examly.springapp`.
**Goal of this step:** implement the feedback API so backend tests BE-13 … BE-15 pass.
**Prerequisites:** STEP-03 … STEP-08.
**Clears:** the final 3 of 15 backend tests.

## Context you need

Authorization is already in `SecurityConfig` (STEP-05) — **no `@PreAuthorize`**.

**The endpoint path is `/api/feedback` — singular.** Not `/api/feedbacks`. The service method is
named `getAllFeedbacks()` (plural) which makes the slip easy.

### Role matrix

| Test | Endpoint | Admin | User |
|---|---|---|---|
| BE-13 | `POST /api/feedback` | **403** | **201** |
| BE-14 | `GET /api/feedback` | **200** | **403** |
| BE-15 | `GET /api/feedback/user/{userId}` | **403** | **200** |

### What BE-13 sends

```json
{ "feedbackText": "Excellent architectural service", "date": "2025-02-27",
  "category": "Service", "user": {"userId": 2}, "architect": {"architectId": 1} }
```

asserting `feedbackText` and `category == "Service"` on the response.

BE-14 and BE-15 assert **status codes only** — the bodies are not inspected.

## ⚠️ Same nested-stub problem as STEP-08

`"user": {"userId": 2}` and `"architect": {"architectId": 1}` arrive as transient id-only objects.
Resolve both from their repositories before saving, or the insert fails on the not-null columns.

## Files to create

### 1. `service/FeedbackService.java`

```java
public interface FeedbackService {
    Feedback createFeedback(Feedback feedback);
    Optional<Feedback> getFeedbackById(Long feedbackId);
    List<Feedback> getAllFeedbacks();
    void deleteFeedback(Long feedbackId);
    List<Feedback> getFeedbacksByUserId(Long userId);
}
```

(SRS also lists `getFeedbacksByArchitectId` — ungraded, deferred to STEP-11.)

### 2. `service/FeedbackServiceImpl.java`

```java
@Service
public class FeedbackServiceImpl implements FeedbackService {

    @Autowired private FeedbackRepo feedbackRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private ArchitectRepo architectRepo;

    @Override
    public Feedback createFeedback(Feedback feedback) {
        User user = userRepo.findById(feedback.getUser().getUserId()).orElse(null);
        if (user == null) return null;
        feedback.setUser(user);

        // architect is optional on Feedback (SRS: nullable = true)
        if (feedback.getArchitect() != null && feedback.getArchitect().getArchitectId() != null) {
            Architect architect =
                architectRepo.findById(feedback.getArchitect().getArchitectId()).orElse(null);
            feedback.setArchitect(architect);
        }

        return feedbackRepo.save(feedback);
    }

    @Override
    public Optional<Feedback> getFeedbackById(Long feedbackId) {
        return feedbackRepo.findById(feedbackId);
    }

    @Override
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepo.findAll();
    }

    @Override
    public void deleteFeedback(Long feedbackId) {
        feedbackRepo.deleteById(feedbackId);
    }

    @Override
    public List<Feedback> getFeedbacksByUserId(Long userId) {
        return feedbackRepo.findByUserUserId(userId);
    }
}
```

Note the null-guard on `architect` — unlike inquiries, feedback may legitimately have none.

### 3. `controller/FeedbackController.java`

```java
@RestController
@RequestMapping("/api/feedback")          // singular
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody Feedback feedback) {
        Feedback saved = feedbackService.createFeedback(feedback);
        return saved == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.status(HttpStatus.CREATED).body(saved);   // 201
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Feedback>> getFeedbacksByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByUserId(userId));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long feedbackId) {
        return feedbackService.getFeedbackById(feedbackId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long feedbackId) {
        feedbackService.deleteFeedback(feedbackId);
        return ResponseEntity.ok().build();
    }
}
```

## Critical requirements

1. **Path is `/api/feedback`, singular**, on the class-level `@RequestMapping`.
2. **POST returns 201 with the saved entity** — two fields are asserted on the body.
3. **Resolve `user` from the repo; guard `architect` for null.**
4. **`date` stays a `String`.** The payload sends `"2025-02-27"`.
5. **No `@PreAuthorize`.**
6. The `/user/{userId}` mapping must win over `/{feedbackId}` for `/api/feedback/user/2`. Spring
   prefers the literal segment, so both mappings can coexist — but BE-15 is the test that proves
   it, so run it after adding `getFeedbackById`.

## ⚠️ Ignore SRS p.43 for this endpoint

The SRS suggests putting `GET /api/feedback` in `permitAll()` for auto-evaluation. **That breaks
BE-14**, which requires a User to get **403** there. Leave it `hasRole("Admin")` as configured in
STEP-05.

## Verify before moving on

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
cd springapp && mvn -q test
```

Expect **15 of 15 backend tests passing**.

If BE-14 shows User getting 200 instead of 403, something `permitAll()`-ed the feedback GET. If
BE-15 is inverted (Admin 200 / User 403), the `/api/feedback/user/*` matcher is declared after the
broader feedback rules in `SecurityConfig`.
