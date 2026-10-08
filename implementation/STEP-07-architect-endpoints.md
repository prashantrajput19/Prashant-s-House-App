# STEP 07 — Architect endpoints

**Project:** ArchitectPoint — Spring Boot 3.0.1, package `com.examly.springapp`.
**Goal of this step:** implement the architect CRUD API so backend tests BE-05 … BE-08 pass.
**Prerequisites:** STEP-03 … STEP-06.
**Clears:** 4 of 15 backend tests.

## Context you need

Authorization is already configured in `SecurityConfig` (STEP-05) — **do not add `@PreAuthorize`**
to these methods. The controller just implements the happy path; the 403s come from the URL
matchers.

### Role matrix enforced by the tests

| Test | Endpoint | Admin | User |
|---|---|---|---|
| BE-05 | `POST /api/architects` | **201** | **403** |
| BE-06 | `GET /api/architects/{id}` | **200** | **403** |
| BE-07 | `GET /api/architects` | **200** | **200** ← both |
| BE-08 | `PUT /api/architects/{id}` | **200** | **403** |

BE-06 and BE-07 pull in opposite directions on the same URL prefix. That is already handled by the
single-`*` matchers in STEP-05; just don't change them.

### Assertions on response bodies

- **BE-05** posts `{architectId:1, name:"John Architects", expertise:"Residential", location:"Chennai", rating:4.5, portfolioLink:"https://portfolio.com/john", status:"Active"}`
  and asserts the response echoes `name`, `expertise`, `location`, `status`.
- **BE-06** GETs `/api/architects/1` and asserts `architectId == 1` plus the same four fields.
- **BE-07** asserts the body `isArray()`.
- **BE-08** PUTs `{architectId:1, name:"Updated Architects", expertise:"Commercial", location:"Bangalore", rating:4.8, ...}`
  and asserts the response echoes `architectId`, `name`, `expertise`, `location`, `status`.

## Files to create

### 1. `service/ArchitectService.java`

```java
public interface ArchitectService {
    Architect addArchitect(Architect architect);
    Architect updateArchitect(Long architectId, Architect updatedArchitect);
    Optional<Architect> getArchitectById(Long architectId);
    List<Architect> getAllArchitects();
    void deleteArchitect(Long architectId);
}
```

Signatures and return types are from SRS p.10 — keep them.

### 2. `service/ArchitectServiceImpl.java`

```java
@Service
public class ArchitectServiceImpl implements ArchitectService {

    @Autowired private ArchitectRepo architectRepo;

    @Override
    public Architect addArchitect(Architect architect) {
        return architectRepo.save(architect);
    }

    @Override
    public Architect updateArchitect(Long architectId, Architect updated) {
        Architect existing = architectRepo.findById(architectId).orElse(null);
        if (existing == null) return null;

        existing.setName(updated.getName());
        existing.setExpertise(updated.getExpertise());
        existing.setLocation(updated.getLocation());
        existing.setRating(updated.getRating());
        existing.setPortfolioLink(updated.getPortfolioLink());
        existing.setStatus(updated.getStatus());

        return architectRepo.save(existing);        // same id — updates in place
    }

    @Override
    public Optional<Architect> getArchitectById(Long architectId) {
        return architectRepo.findById(architectId);
    }

    @Override
    public List<Architect> getAllArchitects() {
        return architectRepo.findAll();
    }

    @Override
    public void deleteArchitect(Long architectId) {
        architectRepo.deleteById(architectId);
    }
}
```

**Update must load-then-mutate.** Saving the deserialised request object directly would work here
(it carries `architectId`) but is fragile; loading the managed entity guarantees you update row 1
rather than inserting a second architect. BE-09's inquiry references architect 1, so a duplicate
row silently corrupts later tests.

### 3. `controller/ArchitectController.java`

```java
@RestController
@RequestMapping("/api/architects")
@CrossOrigin(origins = "*")
public class ArchitectController {

    @Autowired private ArchitectService architectService;

    @PostMapping
    public ResponseEntity<Architect> addArchitect(@RequestBody Architect architect) {
        Architect saved = architectService.addArchitect(architect);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);   // 201 + entity
    }

    @GetMapping("/{architectId}")
    public ResponseEntity<Architect> getArchitectById(@PathVariable Long architectId) {
        return architectService.getArchitectById(architectId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());    // 200 or 404
    }

    @GetMapping
    public ResponseEntity<List<Architect>> getAllArchitects() {
        return ResponseEntity.ok(architectService.getAllArchitects()); // bare JSON array
    }

    @PutMapping("/{architectId}")
    public ResponseEntity<Architect> updateArchitect(@PathVariable Long architectId,
                                                     @RequestBody Architect architect) {
        Architect updated = architectService.updateArchitect(architectId, architect);
        return updated == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{architectId}")
    public ResponseEntity<Void> deleteArchitect(@PathVariable Long architectId) {
        architectService.deleteArchitect(architectId);
        return ResponseEntity.ok().build();
    }
}
```

## Critical requirements

1. **POST returns 201 with the saved entity as the body** — four fields are asserted on it.
2. **GET collection returns a bare JSON array.** `assertTrue(body.isArray())` fails if you wrap it
   as `{"data": [...]}` or `{"architects": [...]}`.
3. **PUT returns the post-update entity**, and must not create a second row.
4. **No `@PreAuthorize`.** Roles are enforced by `SecurityConfig`.
5. `architectId` must appear in the JSON — do not `@JsonIgnore` it (BE-06 and BE-08 read it).

## Constraints

- Do not add a duplicate-name check or throw `DuplicateArchitectException`. BE-05 POSTs the same
  body twice (once per role) and the second call must be rejected by *authorization*, not by a
  business rule.
- Do not add pagination, sorting or filtering to `getAllArchitects`.
- Leave `ArchitectException` / `DuplicateArchitectException` / `GlobalExceptionHandler` as the empty
  stubs they are — wiring an exception handler now risks converting an expected 403 into something
  else. They are addressed in STEP-11.

## Verify before moving on

```bash
mysql -u root --protocol=tcp -p -e "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"
cd springapp && mvn -q test
```

Expect BE-01 … BE-08 passing (8 of 15). BE-09 onward still fail — that is STEP-08.

If BE-06 passes but BE-07 fails (or vice versa), the cause is a `**` wildcard that crept into the
architect matchers in `SecurityConfig`. If both return 401 instead of 403/200, the JWT filter is
not authenticating — revisit STEP-05.
