# FE-09 — `frontend_should_create_feedback_service`

**Status:** Failing · **File:** `angularapp/src/app/services/feedback.service.ts` · **Export:** `FeedbackService`

## What the test does

```ts
TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
service = TestBed.inject(FeedbackService);
expect((service as any)).toBeTruthy();
```

## Why it fails today

`angularapp/src/app/services/` does not exist.

## What to implement

```ts
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  public apiUrl = 'http://localhost:8080';
  constructor(private http: HttpClient) {}

  sendFeedback(feedback: Feedback)              // POST   /api/feedback
  getAllFeedbacksByUserId(userId: number)       // GET    /api/feedback/user/:userId
  deleteFeedback(feedbackId: number)            // DELETE /api/feedback/:feedbackId
  getFeedbacks()                                // GET    /api/feedback
}
```

Method names are taken verbatim from SRS p.17 — note `sendFeedback` (not `addFeedback`) and
`getFeedbacks` (not `getAllFeedbacks`, which is the *backend* service's name).

## Files

**Create:** `angularapp/src/app/services/feedback.service.ts`
**Depends on:** FE-05 (`Feedback`).

## Gotchas

- Endpoint is `/api/feedback` — **singular**, in every one of the four methods.
- Same three service rules as FE-06: `providedIn: 'root'`, `HttpClient`-only constructor, no
  `localStorage` in the constructor.
- All four methods send `Authorization: Bearer <token>`.
- Backend role split (BE-13 … BE-15): `sendFeedback` User-only, `getFeedbacks` Admin-only,
  `getAllFeedbacksByUserId` User-only. If the admin feedback screen calls the wrong one it gets a
  403 at runtime — invisible to Karma, visible in the browser.
- The method-name mismatch between the frontend SRS (`getFeedbacks`) and backend SRS
  (`getAllFeedbacks()`) is intentional in the document; neither name is graded, but staying with
  the SRS names keeps the components readable.

## Out of scope

HTTP verification, the add-feedback form, My-Feedback view, the admin feedback table, the Phase-2
AI review-summary feature.

## Done when

The file exists at the exact path, exports a root-provided `FeedbackService`, and the app compiles.
