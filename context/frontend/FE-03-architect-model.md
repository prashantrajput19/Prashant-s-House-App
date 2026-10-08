# FE-03 — `frontend_Architect_model_should_create_an_instance`

**Status:** Failing · **File:** `angularapp/src/app/models/architect.model.ts` · **Export:** `Architect`

## What the test does

```ts
const architect: Architect = {
  architectId: 1, name: 'John Doe', expertise: 'Residential',
  location: 'New York, NY', rating: 4.5,
  portfolioLink: 'http://example.com/portfolio', status: 'Active'
};
// name, expertise, location, rating, portfolioLink, status each toBeDefined()
```

## Why it fails today

`angularapp/src/app/models/` does not exist.

## What to implement

```ts
export interface Architect {
  architectId?: number;
  name: string;
  expertise: string;
  location: string;
  rating: number;
  portfolioLink: string;
  status: string;
}
```

Matches the SRS p.15 interface exactly.

## Files

**Create:** `angularapp/src/app/models/architect.model.ts`
**Modify:** nothing.

## Gotchas

- `architectId` optional (`?`) per the SRS — new architects don't have one yet. The spec supplies
  it, so either way compiles here, but optional is correct for the add-architect form.
- `rating` is a `number` (4.5), not a string.
- Field names must mirror the backend `Architect` entity so JSON binds without mapping —
  `portfolioLink`, not `portfolio` or `portfolio_link`.
- FE-04 imports `Architect` indirectly via `Partial<Architect>`; keep the export name exact.

## Out of scope

The architect list/add/edit components, search and filter logic, `ArchitectService` (that's FE-07).

## Done when

The file exists at the exact path, exports `Architect`, and the app compiles.
