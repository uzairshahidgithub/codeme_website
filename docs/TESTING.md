# Testing Strategy

**Last Updated:** 2026-04-26

## Test Types

1. **Unit Tests:**
   * **Tool:** Vitest
   * **Characteristics:** Fast execution, fully isolated, strictly no I/O operations (no real network or database calls).
   * **Scope:** Utility functions, isolated hooks, crypto wrappers, data transformers.
2. **Integration Tests:**
   * **Tool:** React Testing Library (Frontend) / Supertest (Backend)
   * **Characteristics:** Combines components with local state and mocked API responses.
   * **Scope:** Complex form submissions, routing logic, state store interactions.
3. **End-to-End (E2E) Tests:**
   * **Tool:** Playwright
   * **Characteristics:** Executes the full application stack through a real browser instance.
   * **Scope:** Critical user journeys (e.g., Signup flow, checkout flow, core dashboard interactions).

## Coverage Thresholds

* **Business Logic:** 80% minimum coverage.
* **UI Components:** 70% minimum coverage.
* **Cryptography & Authentication Code:** 95% minimum coverage.
* *Note: CI pipelines are configured to fail if a PR drops overall coverage below these thresholds.*

## Test Execution

* Run all tests across the workspace:
  ```bash
  pnpm test
  ```
* Run tests for a specific workspace:
  ```bash
  pnpm --filter <pkg> test
  ```
* CI executes the full unit and integration test suite on every PR against protected branches. E2E tests run on staging deployments.

## Visual Regression

* **Tool:** Playwright visual comparisons.
* **Baseline:** Approved baseline images are committed to the repository under `tests/e2e/snapshots/`.
* **Process:** Any visual diff detected during E2E runs will fail the build and attach the diff artifacts for human review. Approval requires updating the baseline via an explicit PR.

## Performance Testing

* **Lighthouse CI:** Integrated into the pull request pipeline to track scores for Performance, Accessibility, Best Practices, and SEO. Regressions > 5 points trigger a build failure.
* **Web Vitals:** Real User Monitoring (RUM) is tracked in production via Vercel Analytics to ensure LCP, INP, and CLS remain within budget.
