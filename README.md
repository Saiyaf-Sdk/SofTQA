# EC4206 Nebo Parfumerie QA assignment

- [Updated assignment report with screenshots](EC4206%20Nebo%20Parfumerie%20QA%20Report%20Updated.pdf)
- [Test case register](test-cases.csv)
- [25 November 2026 retest evidence](evidence/retest/)
- [Earlier evidence and GitHub exports](evidence/)
- [Tracked defect with root cause and lifecycle](defects/STQA-01.md)

The system under test is the Nebo Parfumerie Vue, Express and SQLite storefront from SPA commit `c66699f916dc3fdfb44e0713af9ab0c53f4204ff`. The full assignment suite runs against [sut](sut/). The [original SPA project](../SPA_Project/spa-project/) also contains the verified catalog keyboard-focus fix and its regression tests. Test users, addresses and emails are synthetic. A local production build and temporary or in-memory data isolate the runs.

The assignment retest passed 15 Node tests, 15 Playwright tests, 2 Cucumber scenarios (12 steps) and 14 Newman assertions (7 requests). JMeter completed 550 requests with zero errors. The SPA itself passed 4 backend and 5 browser tests after the fix. The case register retains the original failure for STQA-01-B.

## Assignment coverage

| Brief | Deliverable |
|---|---|
| 3.1 Test planning | Report section 3.1 and quality attributes in section 3.2 |
| 3.2 STLC, environment and traceability | Report section 3.2 and [test-cases.csv](test-cases.csv) |
| 3.3 Black-box design | Equivalence partitions, numerical boundaries and pricing decision table in the report and case register |
| 3.4 White-box design | Complexity calculation and basis cases in the report, [test source](sut/server/pricing.qa.test.mjs) and [coverage output](evidence/retest/test-coverage.txt) |
| 3.5 Unit testing and BDD | [Node testing](evidence/retest/test-coverage.txt), [Gherkin and Cucumber step definitions](sut/features/) and [Cucumber run](evidence/retest/test-bdd.txt) |
| 3.6 Postman and CI | [Postman collection](sut/qa/nebo.postman_collection.json), [Newman results](evidence/retest/test-postman.txt), [workflow](.github/workflows/qa.yml), [archived push record](evidence/qa-github-run.json), [final run screenshot](evidence/ci-passing-run.png) and [initial regression verification screenshot](evidence/ci-regression-verification.png) |
| 3.7 Performance, security and usability | [JMeter plan](performance/catalog-load.jmx), [measurement summary](evidence/retest/jmeter-summary.json), [manual OWASP observations](evidence/retest/owasp-observations.txt) and [browser results](evidence/retest/test-e2e.txt) |
| 3.8 Defects | [GitHub issue export](evidence/defect-github-issue.json), [SPA baseline failure](evidence/retest/spa-baseline-regression.txt), [SPA passing retest](evidence/retest/spa-fixed-test-e2e.txt) and [RCA](defects/STQA-01.md) |
| 3.9 SonarQube | [Scanner configuration](sut/sonar-project.properties), [scan workflow](.github/workflows/sonarqube.yml), [hosted scan](https://github.com/Saiyaf-Sdk/STQA/actions/runs/45423389536), [scanner measures](evidence/sonarqube/measures.json), [findings](evidence/sonarqube/issues.json) and report section 3.9 |
| 3.10 Agile and DevOps | Reflection in the report |

The GitHub Actions, GitHub issue and SonarQube results come from the saved exports for 24 November. The hosted links could not be verified on 25 November. The saved QA and SonarQube workflows both reference commit `df4c6e0`. The SonarQube metrics describe that scan with imported backend and shared LCOV.

## Reproduce the functional checks

From `Test_Cases`, with Node 24 or later and Playwright Chromium:

```powershell
Set-Location sut
npm.cmd ci
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:coverage
npm.cmd run test:e2e
npm.cmd run test:bdd
npm.cmd run test:postman
```

On Windows with Google Chrome installed, set `$env:E2E_BROWSER_CHANNEL='chrome'` before the browser tests and skip the Playwright Chromium install. On macOS or Linux, use `npm` and `npx`. The built storefront can be opened locally after running `npm run dev` for a development server or `npm start` for production mode.

The c8 command measures `server/` and `shared/`. To inspect the original SPA regression trace, run `npx.cmd playwright show-trace ../evidence/retest/spa-baseline-trace.zip` from `sut/`.

Set `$env:QA_SCREENSHOTS = (Resolve-Path ../evidence/retest).Path` from `sut/` before running Playwright and Cucumber to capture the selected browser states again. Playwright writes the images to `sut/test-results/`, and Cucumber writes them to the path in `QA_SCREENSHOTS`.

## Verify the SPA project directly

From `SPA_Project/spa-project`:

```powershell
$env:E2E_BROWSER_CHANNEL = 'chrome'
npm.cmd ci
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

## Reproduce the catalog load test

Build the storefront, return to the repository root and provide the Apache JMeter 5.6.3 launcher path. The runner uses Java, a localhost production build with in-memory SQLite and an isolated results directory under `.tools/`.

```powershell
.\performance\run-jmeter.ps1 -JMeter 'C:\path\apache-jmeter-5.6.3\bin\jmeter.bat'
```

[Baseline raw samples](evidence/retest/jmeter-baseline.jtl) and [10-user raw samples](evidence/retest/jmeter-load.jtl) accompany the retest. The runner writes its summary and raw evidence before it fails on a missed threshold.

## Run SonarQube on another machine

Use a SonarQube Community Build server on localhost or the dedicated GitHub Actions workflow. For a local server, run the coverage command first from `sut/`, set `SONAR_HOST_URL` and `SONAR_TOKEN` in your session, then run the SonarScanner CLI from that directory. The configured scope covers `src/`, `server/` and `shared/` and imports the backend/shared LCOV file.
