Run Playwright end-to-end tests.

First ensure browsers are installed:
```bash
npx playwright install --with-deps chromium
```

Then run the e2e suite:
```bash
npm run test:e2e
```

Report results. If tests fail, analyze the failure output and suggest fixes.
