# STQA-01 Repeated catalog search activation leaves focus on the header

[GitHub issue #1](https://github.com/Saiyaf-Sdk/STQA/issues/1) · Closed · Medium severity · P2 priority

## Reproduction and impact

1. Start the original Nebo build and open the homepage.
2. Focus the header **Search perfumes** link and press Enter. The catalog input receives focus.
3. Focus the header link again and press Enter.

The catalog field should receive focus every time. On the original build, it remained inactive on the second activation. A keyboard user had to navigate to the input manually before typing. The [failed assertion](../evidence/regression-baseline.txt) and [Playwright trace](../evidence/regression-baseline-trace.zip) record the behavior.

## Root cause and repair

The catalog watched the route’s `search` flag. The repeated activation kept the same route and flag, so the watcher had no change to process. Both the initial focus behavior and repeated keyboard activation now have explicit test coverage.

The [fix commit](https://github.com/Saiyaf-Sdk/STQA/commit/55fe1bff0af5b1e53fcd891b6d5e7e9d79a0bbbf) focuses the input immediately on activation within the catalog and preserves current query parameters. The existing route watcher still handles navigation to the catalog from another view.

On 25 November 2026, the same regression [failed on the supplied SPA project](../evidence/retest/spa-baseline-regression.txt). We applied the existing fix to that project and [verified all five browser tests](../evidence/retest/spa-fixed-test-e2e.txt), including repeated activation and query preservation on `/shop`.

## Lifecycle

| Stage | Evidence |
|---|---|
| New | The baseline failure reproduced in Chrome and the issue was opened with reproduction steps. |
| Assigned | The GitHub issue was assigned to the repository account. |
| Fixed | The header now focuses the current catalog search input. |
| Verified | [Local retest](../evidence/playwright-final.txt) and [push workflow](https://github.com/Saiyaf-Sdk/STQA/actions/runs/45420909420) passed. The test also confirmed that the query survives repeat activation on the catalog and its /shop alias. |
| Closed | The verified result was posted to the issue and GitHub marked it closed. See [issue events](../evidence/defect-github-issue.json). |
