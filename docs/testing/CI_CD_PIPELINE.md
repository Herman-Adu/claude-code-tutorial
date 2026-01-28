# CI/CD Pipeline Configuration

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Pipeline Architecture](#pipeline-architecture)
4. [Workflow Files](#workflow-files)
5. [Configuration](#configuration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Kanban Board application using GitHub Actions.

### Goals

- **Automated Testing**: Run all tests on every commit
- **Fast Feedback**: Provide quick feedback to developers
- **Quality Gates**: Block merges if tests fail
- **Code Coverage**: Track and enforce coverage targets
- **Deployment**: Automate deployment to staging and production

### Pipeline Stages

```
┌──────────────┐
│   Commit     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Lint & Type │
│    Check     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Unit Tests  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Integration  │
│    Tests     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Component   │
│    Tests     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  E2E Tests   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Coverage   │
│    Report    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deploy     │
│  (if main)   │
└──────────────┘
```

---

## GitHub Actions Workflows

### Workflow 1: Test Suite (Main Workflow)

**File**: `.github/workflows/test.yml`

**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs**:
1. Lint and Type Check
2. Unit Tests
3. Integration Tests
4. Component Tests
5. E2E Tests (on PR only)
6. Coverage Report

### Workflow 2: Coverage Report

**File**: `.github/workflows/coverage.yml`

**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch

**Jobs**:
1. Generate coverage report
2. Upload to Codecov
3. Comment on PR with coverage diff

### Workflow 3: Deployment

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch (after tests pass)
- Manual workflow dispatch

**Jobs**:
1. Build Docker image
2. Push to container registry
3. Deploy to Vercel/Railway/etc.

---

## Pipeline Architecture

### Matrix Strategy

Run tests across multiple Node.js versions and operating systems:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

### Caching Strategy

Cache dependencies to speed up workflows:

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Parallel Execution

Run independent jobs in parallel:

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    # ...

  integration-tests:
    runs-on: ubuntu-latest
    # ...

  component-tests:
    runs-on: ubuntu-latest
    # ...
```

---

## Workflow Files

### `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  # ============================================================================
  # Job 1: Lint and Type Check
  # ============================================================================
  lint:
    name: Lint and Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npx tsc --noEmit

  # ============================================================================
  # Job 2: Unit Tests
  # ============================================================================
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload unit test coverage
        uses: actions/upload-artifact@v3
        with:
          name: unit-coverage
          path: coverage/unit

  # ============================================================================
  # Job 3: Integration Tests
  # ============================================================================
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: lint

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npm run db:migrate:deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run integration tests
        run: npm run test:integration -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Upload integration test coverage
        uses: actions/upload-artifact@v3
        with:
          name: integration-coverage
          path: coverage/integration

  # ============================================================================
  # Job 4: Component Tests
  # ============================================================================
  component-tests:
    name: Component Tests
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run component tests
        run: npm run test:components -- --coverage

      - name: Upload component test coverage
        uses: actions/upload-artifact@v3
        with:
          name: component-coverage
          path: coverage/components

  # ============================================================================
  # Job 5: E2E Tests
  # ============================================================================
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: [unit-tests, integration-tests, component-tests]

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Setup test database
        run: npm run db:migrate:deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Start application
        run: npm start &
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          PORT: 3000

      - name: Wait for application to be ready
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000

      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # ============================================================================
  # Job 6: Merge Coverage Reports
  # ============================================================================
  coverage:
    name: Coverage Report
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, component-tests]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Download unit coverage
        uses: actions/download-artifact@v3
        with:
          name: unit-coverage
          path: coverage/unit

      - name: Download integration coverage
        uses: actions/download-artifact@v3
        with:
          name: integration-coverage
          path: coverage/integration

      - name: Download component coverage
        uses: actions/download-artifact@v3
        with:
          name: component-coverage
          path: coverage/components

      - name: Merge coverage reports
        run: npx nyc merge coverage coverage/merged/coverage.json

      - name: Generate final coverage report
        run: npx nyc report --reporter=lcov --reporter=text --temp-dir=coverage/merged

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests,integration,components
          name: kanban-board-coverage
          fail_ci_if_error: true

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
          delete-old-comments: true
```

### `.github/workflows/coverage.yml`

```yaml
name: Coverage Report

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  coverage:
    name: Generate Coverage Report
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: Run all tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          verbose: true

      - name: Generate coverage badges
        uses: cicirello/jacoco-badge-generator@v2
        with:
          badges-directory: coverage/badges
          generate-branches-badge: true
          generate-summary: true

      - name: Upload coverage report as artifact
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: [test] # Reference test workflow
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Configuration

### Required Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `CODECOV_TOKEN` | Token for uploading coverage to Codecov |
| `VERCEL_TOKEN` | Token for deploying to Vercel |
| `DATABASE_URL` | Production database connection string |

**How to add secrets**:
1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add name and value

### Environment Variables

```yaml
env:
  NODE_ENV: test
  DATABASE_URL: postgresql://test:test@localhost:5432/test_db
  NEXT_TELEMETRY_DISABLED: 1
```

### Branch Protection Rules

Set up branch protection for `main` branch:

1. **Require status checks to pass**:
   - Lint and Type Check
   - Unit Tests
   - Integration Tests
   - Component Tests
   - Coverage Report

2. **Require branches to be up to date**: ✅

3. **Require linear history**: ✅

4. **Include administrators**: ✅

---

## Best Practices

### 1. Fast Feedback

- Run fast tests (lint, unit) first
- Run slow tests (E2E) only on PR
- Use parallel execution for independent jobs

### 2. Fail Fast

- Cancel workflow if lint fails
- Don't run E2E tests if unit tests fail
- Set appropriate timeouts

### 3. Caching

```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache/Cypress
      node_modules/.cache
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
```

### 4. Artifact Management

- Upload test results for debugging
- Keep artifacts for 30 days
- Upload coverage reports

### 5. Security

- Use secrets for sensitive data
- Scan dependencies for vulnerabilities
- Use minimal permissions for tokens

---

## Troubleshooting

### Issue: Tests pass locally but fail in CI

**Possible causes**:
- Different Node.js version
- Missing environment variables
- Timezone differences
- File system case sensitivity

**Solution**:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

### Issue: E2E tests are flaky

**Possible causes**:
- Race conditions
- Insufficient wait times
- Resource constraints

**Solution**:
```yaml
- name: Run E2E tests
  run: npm run test:e2e -- --retries=2
  timeout-minutes: 30
```

### Issue: Coverage upload fails

**Possible causes**:
- Invalid Codecov token
- Network issues
- File path issues

**Solution**:
```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: false # Don't fail on upload errors
    verbose: true
```

### Issue: Out of disk space

**Solution**:
```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /opt/ghc
    sudo rm -rf "/usr/local/share/boost"
```

---

## Summary

This CI/CD pipeline provides:

✅ **Automated testing** on every commit
✅ **Fast feedback** with parallel execution
✅ **Quality gates** with branch protection
✅ **Coverage tracking** with Codecov
✅ **Automated deployment** to production

### Next Steps

1. Copy workflow files to `.github/workflows/`
2. Add required secrets to repository
3. Configure branch protection rules
4. Set up Codecov integration
5. Test the pipeline with a PR

---

*For more details, see [GitHub Actions Documentation](https://docs.github.com/en/actions)*
