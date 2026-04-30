# Deferred TODOs

Items intentionally deferred from the cleanup sweep. Each entry documents
*why* it's deferred and *what conditions* would justify revisiting.

## API conventions: `{ result }` response wrapper inconsistency
- **Where:** src/services/API/APIAuth.ts (`tokenLogin`)
- **Why deferred:** The `tokenLogin` endpoint returns `{ result: AuthCallbackResponse }`
  while the other auth endpoints return the response shape directly. This is
  a backend convention mismatch, not a frontend bug — aligning it requires
  cross-team agreement on a single response-shape standard, not a unilateral
  rename.
- **Revisit when:** Backend team aligns on a single response shape standard
  for auth endpoints. At that point, drop the wrapper on the frontend and
  flatten the type.

## Open-house sign-in route integration points
- **Where:** src/app/api/open-house/sign-in/route.ts
- **Why deferred:** Open-house sign-in workflow is not yet prioritized. The
  route exists as scaffolding — it validates input and logs the payload but
  does not persist or forward it.
- **Revisit when:** Open-house feature is being actively built. Will need:
  Repliers API lead capture (similar to contact service), eventsCollection
  record, agent email notification, and CRM (Follow Up Boss) push.

## Spanish (hreflang) alternates in `<head>`
- **Where:** src/app/layout.tsx
- **Why deferred:** No Spanish content published yet. Adding hreflang tags
  before the `/es` routes exist tells Google about pages that 404, which is
  worse than no hreflang at all.
- **Revisit when:** Spanish translations of any page are live. The exact
  pattern to add is documented inline in layout.tsx as a NOTE comment.

## NATS queue migration in oauth client-registration reporting
- **Where:** backend/src/services/oauth.ts (`callback` → `reportClientRegistration`)
- **Why deferred:** No NATS infrastructure in this deployment. The current
  fire-and-forget synchronous call is correct for non-NATS deployments and
  the analytics report is not on the critical path.
- **Revisit when:** Backend moves to NATS-based message queueing. Replace
  the inline call with a queue publish so signup latency does not depend on
  the eventsCollection round-trip.

## diffAgent disabled test (deleted)
- **Where:** src/providers/AgentsProvider/utils/diff/diffAgent.test.ts
- **Why deferred:** The disabled test for "multiple differences" exercised
  phone-number formatting via libphonenumber-js, which loads metadata that
  was failing under the project's jest/ts-jest ESM setup. Re-enabling
  requires new jest config (transformIgnorePatterns or a metadata mock),
  which is outside the constraints of the cleanup sweep ("no new test
  infra"). Permanently disabled tests are worse than no tests, so the
  block was deleted. The remaining three test cases still cover the diff
  logic for non-phone fields and the falsy-value exclusion.
- **Revisit when:** A test-infra pass adds proper ESM-friendly handling of
  libphonenumber-js (e.g. `transformIgnorePatterns` exception or a
  `__mocks__` stub for the metadata import). At that point, restore the
  multi-field assertion that includes a phone-number diff.
