---
name: "K6 Performance Tests"
description: "Implement K6 performance tests and integrate results into Allure report."
labels: ["performance", "k6", "allure", "enhancement"]
---

## Summary

Implement K6 performance tests for the To-Do API and UI, and integrate K6 results into the Allure report for CI visibility.

## Tasks

- [ ] Add K6 as a dev dependency and document installation
- [ ] Write at least 5 K6 performance test scripts:
  1. API: Create Task (POST /api/tasks)
  2. API: Get All Tasks (GET /api/tasks)
  3. API: Update Task (PUT /api/tasks/:id)
  4. API: Delete Task (DELETE /api/tasks/:id)
  5. UI: Load To-Do List Page (simulate browser load)
- [ ] Integrate K6 test execution in CI workflow
- [ ] Convert K6 results to Allure format (use k6-to-allure or custom script)
- [ ] Merge K6 results into Allure report
- [ ] Document usage and results integration in README

## Acceptance Criteria

- K6 tests run in CI and locally
- Allure report includes K6 performance results
- Example K6 scripts and integration steps are documented

## References

- [K6 Documentation](https://k6.io/docs/)
- [k6-to-allure](https://github.com/qa-tools/k6-to-allure)
- [Allure Docs](https://docs.qameta.io/allure/)
