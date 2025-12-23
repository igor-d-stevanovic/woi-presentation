# Allure History & Trends Tracking

This document explains how to track test trends and history using Allure reports.

## Overview

Allure provides powerful trend tracking capabilities that show test execution history over time. This allows you to:

- **Track test stability**: See which tests pass/fail consistently
- **Identify flaky tests**: Tests that sometimes pass and sometimes fail
- **Monitor duration trends**: See if tests are getting slower over time
- **View historical data**: Compare results across multiple test runs

## How It Works

### History Tracking Mechanism

1. **historyId Generation**: Each test gets a consistent MD5 hash based on its name and suite

   - Same test always gets same historyId across runs
   - Ensures proper trend correlation

2. **History Preservation**: After each report generation, history data is saved

   - Stored in `allure-report/history/` directory
   - Contains test execution history and trend data

3. **History Restoration**: Before new test run, previous history is copied
   - Copied from `allure-report/history/` to `allure-results/history/`
   - New test results are merged with historical data

## Local Usage

### Running Tests with History Tracking

```bash
# Run tests and generate report with history
npm run test:unit:trends
```

This command:

1. Cleans old results but preserves history
2. Runs unit tests
3. Generates Allure report with historical data

### Manual History Management

#### View History-Enabled Report

```bash
# After running test:unit:trends
npm run allure:open
```

#### Clean Everything (Fresh Start)

```bash
# Remove all results and history
npm run allure:clean
```

#### Clean but Keep History

```bash
# Remove results but preserve history for trends
npm run allure:clean:keep-history
```

### NPM Scripts

| Script                      | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `test:unit:trends`          | Run tests with full history tracking                   |
| `allure:generate:history`   | Generate report preserving history (no `--clean` flag) |
| `allure:clean`              | Remove all Allure data (fresh start)                   |
| `allure:clean:keep-history` | Clean but preserve history                             |

## CI/CD Integration

### GitHub Actions Workflow

The CI workflow automatically manages history:

```yaml
- name: Download previous Allure history
  uses: dawidd6/action-download-artifact@v3
  continue-on-error: true
  with:
    workflow: ci.yml
    name: allure-history
    path: allure-results/history

- name: Generate Allure report with history
  run: npx allure generate allure-results -o allure-report

- name: Upload Allure history
  uses: actions/upload-artifact@v4
  with:
    name: allure-history
    path: allure-report/history
    retention-days: 90
```

### History Retention

- **Artifacts**: Stored for 90 days in GitHub Actions
- **Reports**: Deployed to GitHub Pages (persistent)
- **Trends**: Visible for up to 90 days of test runs

## Understanding Allure Trends

### Trend Graphs

In the Allure report, you'll see:

1. **Duration Trend**: Line graph showing test execution time over runs
2. **Retries Trend**: How many times tests were retried
3. **Categories Trend**: Distribution of test categories (passed/failed)

### History Table

Each test shows:

- **Previous runs**: Status icons (✓ pass, ✗ fail, ○ skip)
- **Duration changes**: Increasing/decreasing execution time
- **Flakiness indicator**: Tests that pass/fail intermittently

### Retries (not configured in this setup)

Allure supports tracking test retries and can show, when retries are enabled in your test runner configuration:

- Number of retry attempts
- Success rate across retries
- Time spent on retries

> Note: The current Jest + Allure setup in this project does **not** configure or enable test retries, so this information will not appear in reports unless you add a retry mechanism and wire it into Allure.
## Best Practices

### 1. Consistent Test Names

Keep test names stable across refactoring:

```javascript
// ✅ Good - Stable name
test("HAPPY PATH: should add todo with valid input", () => {});

// ❌ Bad - Changing name breaks history
test("should add todo #1", () => {}); // Name includes run number
```

### 2. Regular Cleanup

Clean old history periodically to avoid bloat:

```bash
# Every few weeks or after major refactoring
npm run allure:clean
```

### 3. Monitor Trends

Check trends regularly:

- Look for tests becoming slower
- Identify flaky tests (inconsistent pass/fail)
- Review failed test history

### 4. History After Refactoring

After major test refactoring:

```bash
# Start fresh to avoid false trends
npm run allure:clean
npm run test:unit
npm run allure:generate
```

## Troubleshooting

### Issue: No History Showing

**Cause**: First run or history was cleared

**Solution**: Run tests at least twice

```bash
npm run test:unit:trends  # First run
npm run test:unit:trends  # Second run - now shows trends
```

### Issue: Wrong Trends After Refactoring

**Cause**: Test names changed but historyId stayed same

**Solution**: Clear history and start fresh

```bash
npm run allure:clean
npm run test:unit:trends
```

### Issue: History Not Preserved in CI

**Cause**: Artifact not found or expired

**Solution**:

- Check artifact retention (90 days)
- Ensure `allure-history` artifact uploaded in previous run
- Verify `continue-on-error: true` in workflow

## Advanced Configuration

### Custom History Directory

Modify `allure-reporter.js`:

```javascript
constructor(globalConfig, options) {
  this.historyDir = options.historyDir || path.join(this.resultsDir, 'history');
}
```

### History Retention Period

Adjust in CI workflow:

```yaml
- name: Upload Allure history
  uses: actions/upload-artifact@v4
  with:
    name: allure-history
    retention-days: 30 # Change from 90 to 30 days
```

## Files Generated

### allure-results/history/

Contains history data from previous reports:

- `history-trend.json` - Trend graph data
- `duration-trend.json` - Duration over time
- `retry-trend.json` - Retry statistics
- `categories-trend.json` - Category distribution
- `*.json` - Individual test history files

### allure-report/history/

Generated after report creation, used for next run:

- Same structure as `allure-results/history/`
- Updated with current run data
- Copied back to results directory before next run

## Example Workflow

### Local Development

```bash
# Day 1: Initial baseline
npm run test:unit:trends
npm run allure:open

# Day 2: After changes
npm run test:unit:trends
npm run allure:open
# View: Trends comparing Day 1 vs Day 2

# Day 3: More changes
npm run test:unit:trends
# View: Trends showing 3-day history
```

### CI/CD

```bash
# Commit 1: First CI run
git push  # CI runs, creates allure-history artifact

# Commit 2: Second CI run
git push  # CI downloads history, generates report with trends

# Commit 3+: Continuous tracking
git push  # Each run adds to trend history
```

## Benefits

✅ **Early Detection**: Spot degrading tests before they become problems

✅ **Flakiness Visibility**: Identify unreliable tests that need fixing

✅ **Performance Monitoring**: Track test execution time trends

✅ **Historical Context**: Understand test behavior over time

✅ **Better Debugging**: See when tests started failing

---

**Note**: History tracking requires at least 2 test runs to show meaningful trends. The more runs you have, the better the trend visualization.
