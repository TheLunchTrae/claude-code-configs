---
description: Generate and run E2E tests with Playwright
agent: e2e-runner
subtask: true
---

Analyze user flows, create Playwright test journeys, run tests, and report results with artifacts.

Selector strategy: prefer `data-testid` attributes; avoid CSS classes that change frequently.
Use Playwright's auto-waiting — no explicit timeouts. Each test must be independent with
proper setup/teardown.

Test scope: critical flows (auth, core features, payments), edge cases (network failures,
invalid inputs), and cross-browser scenarios.

Capture on failure: screenshots, video recordings, trace files, and network logs.

Report: pass/fail/skip counts with error messages, screenshots, and videos for failures.
