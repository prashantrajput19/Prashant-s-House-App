# STEP 08 — Architect Inquiry endpoints

**Project:** ArchitectPoint — Spring Boot 3.0.1, package `com.examly.springapp`.
**Goal of this step:** implement the inquiry API so backend tests BE-09 … BE-12 pass.
**Prerequisites:** STEP-03 … STEP-07.
**Clears:** 4 of 15 backend tests.

## Context you need

Authorization is already in `SecurityConfig` (STEP-05) — **no `@PreAuthorize`**.

### Role matrix — note the roles invert relative to architects

| Test | Endpoint | Admin | User |
|---|---|---|---|
| BE-09 | `POST /api/inquiries` | **403** | **201** |
| BE-10 | `GET /api/inquiries` | **200** | **403** |
| BE-11 | `GET /api/inquiries/user/{userId}` | **403** | **200** |
| BE-12 | `PUT /api/inquiries/{id}` | **200** | **403** |

Four different rules under one prefix. `POST` is User-only while `GET` on the *same* path is
Admin-only; `/user/*` is User-only while `PUT /{id}` is Admin-only. STEP-05 already encodes this
correctly — don't "tidy" those matchers.

### What the tests send

**BE-09** POSTs:

```json
{ "message": "I need a residential architect for a villa project",
  "status": "Pending", "priority": "High",
  "contactDetails": "user@email.com, 9876543210",
  "user": {"userId": 2}, "architect": {"architectId": 1} }
```

asserting `status == "Pending"`, `priority == "High"` and the `message` echo back.

**BE-12** PUTs to `/api/inquiries/1`:

```json
{ "inquiryId": 1, "message": "Updated inquiry message", "status": "Resolved",
  "priority": "Medium", "contactDetails": "updated@email.com",
  "user": {"userId": 2}, "architect": {"architectId": 1} }
```

asserting `status == "Resolved"`, `priority == "Medium"`, `message == "Updated inquiry message"`.

BE-10 and BE-11 only assert the body `isArray()`.

## ⚠️ The nested-stub problem — the main failure mode here

`"user": {"userId": 2}` deserialises into a **transient `User` with only `userId` set** — no email,
no password, no username. Saving the inquiry with that object attached makes Hibernate try to
persist a blank user, or throws on the not-null columns.

**Always resolve both references from the database before saving.** This is the single most common
cause of a 500 on BE-09.

## Files to create

### 1. `service/ArchitectInquiryService.java`

```java
public interface ArchitectInquiryService {
    ArchitectInquiry createInquiry(ArchitectInquiry architectInquiry);
    ArchitectInquiry updateInquiry(Long inquiryId, ArchitectInquiry updatedInquiry);
    List<ArchitectInquiry> getInquiriesByUserId(Long userId);
    List<ArchitectInquiry> getAllInquiries();
    void deleteInquiry(Long inquiryId);
}
```

(The SRS also lists `getInquiriesByArchitectId`, `getUnresolvedInquiries`, `getInquiriesByPriority`
— ungraded, deferred to STEP-11.)

### 2. `service/ArchitectInquiryServiceImpl.java`

```java
@Service
public class ArchitectInquiryServiceImpl implements ArchitectInquiryService {

    @Autowired private ArchitectInquiryRepo inquiryRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private ArchitectRepo architectRepo;

    @Override
    public ArchitectInquiry createInquiry(ArchitectInquiry inquiry) {
        // resolve the id-only stubs into managed entities
        User user = userRepo.findById(inquiry.getUser().getUserId()).orElse(null);
        Architect architect =
            architectRepo.findById(inquiry.getArchitect().getArchitectId()).orElse(null);
        if (user == null || architect == null) return null;

        inquiry.setUser(user);
        inquiry.setArchitect(architect);
        return inquiryRepo.save(inquiry);
    }

    @Override
    public ArchitectInquiry updateInquiry(Long inquiryId, ArchitectInquiry updated) {
        ArchitectInquiry existing = inquiryRepo.findById(inquiryId).orElse(null);
        if (existing == null) return null;

        existing.setMessage(updated.getMessage());
        existing.setStatus(updated.getStatus());
        existing.setPriority(updated.getPriority());
        existing.setContactDetails(updated.getContactDetails());
        // keep the existing user/architect relations — do not reattach the request's stubs

        return inquiryRepo.save(existing);
    }

    @Override
    public List<ArchitectInquiry> getInquiriesByUserId(Long userId) {
        return inquiryRepo.findByUserUserId(userId);
    }

    @Override
    public List<ArchitectInquiry> getAllInquiries() {
        return inquiryRepo.findAll();
    }

    @Override
    public void deleteInquiry(Long inquiryId) {
        inquiryRepo.deleteById(inquiryId);
    }
}
```

### 3. `controller/ArchitectInquiryController.java`

```java
@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = "*")
public class ArchitectInquiryController {

    @Autowired private ArchitectInquiryService inquiryService;

    @PostMapping
    public ResponseEntity<ArchitectInquiry> addInquiry(@RequestBody ArchitectInquiry inquiry) {
        ArchitectInquiry saved = inquiryService.createInquiry(inquiry);
        return saved == null
                ? ResponseEntity.badRequest().build()
                : ResponseEntity.status(HttpStatus.CREATED).body(saved);   // 201
    }

    @GetMapping
    public ResponseEntity<List<ArchitectInquiry>> getAllInquiries() {
        return ResponseEntity.ok(inquiryService.getAllInquiries());        // bare array
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ArchitectInquiry>> getInquiriesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(inquiryService.getInquiriesByUserId(userId));
    }

    @PutMapping("/{inquiryId}")
    public ResponseEntity<ArchitectInquiry> updateInquiry(@PathVariable Long inquiryId,
                                                          @RequestBody ArchitectInquiry inquiry) {
        ArchitectInquiry updated = inquiryService.updateInquiry(inquiryId, inquiry);
        return updated == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{inquiryId}")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long inquiryId) {
        inquiryService.deleteInquiry(inquiryId);
        return ResponseEntity.ok().build();
    }
}
```

## Critical requirements

1. **Resolve `user` and `architect` from their repos before saving** (see the warning above).
2. **POST returns 201 with the saved entity.** Three fields are asserted on the body.
3. **Do not overwrite `status` with a server-side default.** The client sends `"Pending"` and
   BE-12 later sends `"Resolved"`; a forced default breaks the update assertion.
4. **PUT mutates the existing row.** Do not persist the request body as a new inquiry.
5. **Both GET endpoints return bare JSON arrays.**
6. **No `@PreAuthorize`.**
7. Route ordering: `/user/{userId}` must not be captured by a `/{inquiryId}` mapping. Spring
   prefers the literal segment, so the code above is safe — but if you add
   `GET /api/inquiries/{inquiryId}` (SRS, ungraded), re-test BE-11 afterwards.

## Verify before moving on

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
cd springapp && mvn -q test
```

Expect BE-01 … BE-12 passing (12 of 15).

If BE-09 returns 500, the nested stubs were not resolved — or a bidirectional relation is causing
infinite JSON recursion (STEP-03 says keep them unidirectional). If BE-10/BE-11 return the wrong
role outcome, check that `/api/inquiries/user/*` is declared **before** the other inquiry matchers.
