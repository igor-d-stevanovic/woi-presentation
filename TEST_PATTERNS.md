# Test Pattern Examples - AAA Pattern Implementation

## Overview

This document showcases examples of how the AAA (Arrange-Act-Assert) pattern is implemented throughout the test suite, along with examples of Happy Path, Failure Mode, and Edge Case testing.

## The AAA Pattern

The AAA pattern divides each test into three distinct sections:

1. **Arrange** - Set up the test conditions
2. **Act** - Execute the functionality being tested
3. **Assert** - Verify the expected outcomes

---

## Example 1: HAPPY PATH - Basic Functionality

### Test: Adding a Todo with Valid Input

```javascript
test("HAPPY PATH: should add a todo with valid input", () => {
  // ============ ARRANGE ============
  // Set up the test environment and input data
  const nameInput = document.getElementById("todoName");
  const statusSelect = document.getElementById("todoStatus");
  nameInput.value = "New Task";
  statusSelect.value = "not started";

  // ============ ACT ============
  // Execute the functionality we're testing
  const result = app.addTodo();

  // ============ ASSERT ============
  // Verify all expected outcomes
  expect(result).toBe(true);
  expect(app.todos.length).toBe(1);
  expect(app.todos[0].name).toBe("New Task");
  expect(app.todos[0].priority).toBe("1");
  expect(app.todos[0].status).toBe("not started");
  expect(app.todos[0].id).toBeDefined();
});
```

**Why this is a Happy Path:**

- Uses valid, expected inputs
- Tests the primary use case
- Verifies the system works as intended

---

## Example 2: FAILURE MODE - Invalid Input

### Test: Rejecting Empty Task Names

```javascript
test("FAILURE MODE: should not add todo with empty name", () => {
  // ============ ARRANGE ============
  // Set up the test with INVALID input (empty string)
  const nameInput = document.getElementById("todoName");
  nameInput.value = "";

  // ============ ACT ============
  // Attempt to add the todo
  const result = app.addTodo();

  // ============ ASSERT ============
  // Verify the system properly rejects the invalid input
  expect(result).toBe(false);
  expect(app.todos.length).toBe(0);
  expect(global.alert).toHaveBeenCalledWith("Please enter a task name!");
});
```

**Why this is a Failure Mode:**

- Tests error handling
- Uses invalid input deliberately
- Verifies proper error messages
- Ensures data integrity

---

## Example 3: FAILURE MODE - Missing DOM Elements

### Test: Handling Missing Input Element

```javascript
test("FAILURE MODE: should throw error if name input element not found", () => {
  // ============ ARRANGE ============
  // Simulate a broken DOM by removing required element
  document.getElementById("todoName").remove();

  // ============ ACT & ASSERT ============
  // Verify the system throws an appropriate error
  expect(() => app.addTodo()).toThrow("Name input element not found");
});
```

**Why this is a Failure Mode:**

- Tests error handling for missing DOM elements
- Verifies the app doesn't crash silently
- Ensures proper error messages for debugging

---

## Example 4: EDGE CASE - Boundary Conditions

### Test: Maximum Length Input

```javascript
test("EDGE CASE: should accept name at exactly max length", () => {
  // ============ ARRANGE ============
  // Create input at EXACT boundary (200 characters)
  const nameInput = document.getElementById("todoName");
  const maxLengthName = "a".repeat(200);
  nameInput.value = maxLengthName;

  // ============ ACT ============
  // Attempt to add the todo
  const result = app.addTodo();

  // ============ ASSERT ============
  // Verify boundary condition is handled correctly
  expect(result).toBe(true);
  expect(app.todos.length).toBe(1);
  expect(app.todos[0].name).toBe(maxLengthName);
});
```

**Why this is an Edge Case:**

- Tests boundary condition (exactly at limit)
- Verifies the system handles edge values
- Ensures the validation logic is correct

---

## Example 5: EDGE CASE - Special Characters

### Test: Unicode and Emoji Support

```javascript
test("EDGE CASE: should handle unicode characters in task name", () => {
  // ============ ARRANGE ============
  // Use unusual but valid input (unicode, emojis)
  const nameInput = document.getElementById("todoName");
  const unicodeName = "タスク 📝 émojis";
  nameInput.value = unicodeName;

  // ============ ACT ============
  app.addTodo();

  // ============ ASSERT ============
  // Verify unicode is preserved correctly
  expect(app.todos[0].name).toBe(unicodeName);
});
```

**Why this is an Edge Case:**

- Tests with unusual but valid input
- Verifies international character support
- Ensures modern emoji handling

---

## Example 6: FAILURE MODE - Invalid ID Types

### Test: Type Validation for IDs

```javascript
test("FAILURE MODE: should throw error for non-number ID", () => {
  // ============ ARRANGE ============
  // Prepare to pass invalid type (string instead of number)

  // ============ ACT & ASSERT ============
  // Verify proper type validation
  expect(() => app.deleteTodo("not a number")).toThrow("Invalid todo ID");
});
```

**Why this is a Failure Mode:**

- Tests type validation
- Prevents runtime errors
- Ensures robust error handling

---

## Example 7: EDGE CASE - Null and Undefined Handling

### Test: Helper Function with Null Input

```javascript
test("EDGE CASE: should handle null input", () => {
  // ============ ARRANGE ============
  // No arrangement needed - testing with null

  // ============ ACT ============
  const result = app.escapeHtml(null);

  // ============ ASSERT ============
  // Verify graceful handling of null
  expect(result).toBe("");
});
```

**Why this is an Edge Case:**

- Tests with null input (common edge case)
- Verifies defensive programming
- Prevents null reference errors

---

## Example 8: HAPPY PATH - Complex Workflow

### Test: Persistence to LocalStorage

```javascript
test("HAPPY PATH: should persist todo to localStorage", () => {
  // ============ ARRANGE ============
  // Set up the input
  const nameInput = document.getElementById("todoName");
  nameInput.value = "Persistent Task";

  // ============ ACT ============
  // Add the todo (which should trigger save)
  app.addTodo();

  // ============ ASSERT ============
  // Verify persistence occurred correctly
  const savedData = localStorage.getItem("todos");
  expect(savedData).toBeDefined();
  const parsed = JSON.parse(savedData);
  expect(parsed.length).toBe(1);
  expect(parsed[0].name).toBe("Persistent Task");
});
```

**Why this is a Happy Path:**

- Tests the complete workflow
- Verifies integration with localStorage
- Ensures data persistence works

---

## Example 9: FAILURE MODE - Corrupted Data

### Test: Handling Invalid JSON

```javascript
test("FAILURE MODE: should handle corrupted localStorage data gracefully", () => {
  // ============ ARRANGE ============
  // Simulate corrupted localStorage with invalid JSON
  localStorage.setItem("todos", "invalid json{{{");
  const consoleSpy = jest.spyOn(console, "error").mockImplementation();

  // ============ ACT ============
  const newApp = new TodoApp(false);
  const result = newApp.loadTodos();

  // ============ ASSERT ============
  // Verify graceful error handling
  expect(result).toBe(false);
  expect(newApp.todos).toEqual([]);
  expect(consoleSpy).toHaveBeenCalled();

  // Cleanup
  consoleSpy.mockRestore();
});
```

**Why this is a Failure Mode:**

- Tests error recovery
- Simulates real-world corruption
- Verifies system doesn't crash
- Ensures proper error logging

---

## Example 10: EDGE CASE - Empty Collections

### Test: Deleting from Empty List

```javascript
test("EDGE CASE: should handle deletion from empty list", () => {
  // ============ ARRANGE ============
  // Set up an empty list
  app.todos = [];
  global.confirm.mockReturnValue(true);

  // ============ ACT ============
  // Attempt to delete from empty list
  const result = app.deleteTodo(1);

  // ============ ASSERT ============
  // Verify graceful handling
  expect(result).toBe(false);
  expect(app.todos.length).toBe(0);
});
```

**Why this is an Edge Case:**

- Tests with empty collection
- Verifies boundary condition
- Ensures no crashes on empty state

---

## Example 11: FAILURE MODE - Invalid Enum Values

### Test: Invalid Status Validation

```javascript
test("FAILURE MODE: should handle invalid status gracefully", () => {
  // ============ ARRANGE ============
  // Set up invalid enum value
  const nameInput = document.getElementById("todoName");
  const statusSelect = document.getElementById("todoStatus");
  nameInput.value = "Test Task";
  statusSelect.value = "invalid status";

  // ============ ACT ============
  const result = app.addTodo();

  // ============ ASSERT ============
  // Verify validation catches invalid value
  expect(result).toBe(false);
  expect(global.alert).toHaveBeenCalledWith("Invalid status selected!");
});
```

**Why this is a Failure Mode:**

- Tests enum validation
- Prevents invalid state
- Ensures data integrity

---

## Example 12: EDGE CASE - XSS Prevention

### Test: HTML Escaping for Security

```javascript
test("EDGE CASE: should escape HTML in todo names", () => {
  // ============ ARRANGE ============
  // Set up malicious input (XSS attempt)
  app.todos = [
    {
      id: 1,
      name: '<script>alert("xss")</script>',
      priority: "1",
      status: "not started",
    },
  ];

  // ============ ACT ============
  app.render();

  // ============ ASSERT ============
  // Verify HTML is escaped (security check)
  const todoName = document.querySelector(".todo-name");
  expect(todoName.textContent).toBe('<script>alert("xss")</script>');
  expect(todoName.innerHTML).not.toContain("<script>");
});
```

**Why this is an Edge Case:**

- Tests security vulnerability
- Verifies XSS prevention
- Ensures safe rendering

---

## Example 13: INTEGRATION TEST - Complete Workflow

### Test: Add, Edit, Delete Workflow

```javascript
test("COMPLETE WORKFLOW: add, edit, and delete todo", () => {
  // ============ ARRANGE ============
  const nameInput = document.getElementById("todoName");
  nameInput.value = "Integration Test Task";

  // ============ ACT - PART 1: Add ============
  app.addTodo();
  expect(app.todos.length).toBe(1);
  const todoId = app.todos[0].id;

  // ============ ACT - PART 2: Edit ============
  app.currentEditingId = todoId;
  app.render();
  const statusSelect = document.getElementById(`edit-status-${todoId}`);
  statusSelect.value = "completed";
  app.updateTodo(todoId);
  expect(app.todos[0].status).toBe("completed");

  // ============ ACT - PART 3: Delete ============
  global.confirm.mockReturnValue(true);
  app.deleteTodo(todoId);

  // ============ ASSERT ============
  // Verify complete workflow succeeded
  expect(app.todos.length).toBe(0);
});
```

**Why this is an Integration Test:**

- Tests complete user workflow
- Verifies multiple functions work together
- Ensures end-to-end functionality

---

## Example 14: EDGE CASE - Rapid Sequential Operations

### Test: Multiple Quick Additions

```javascript
test("EDGE CASE: should add multiple todos sequentially", () => {
  // ============ ARRANGE & ACT ============
  // Rapidly add multiple todos
  const nameInput = document.getElementById("todoName");

  nameInput.value = "Task 1";
  app.addTodo();

  nameInput.value = "Task 2";
  app.addTodo();

  nameInput.value = "Task 3";
  app.addTodo();

  // ============ ASSERT ============
  // Verify all additions succeeded
  expect(app.todos.length).toBe(3);
  expect(app.todos[0].name).toBe("Task 1");
  expect(app.todos[1].name).toBe("Task 2");
  expect(app.todos[2].name).toBe("Task 3");
});
```

**Why this is an Edge Case:**

- Tests rapid sequential operations
- Verifies no race conditions
- Ensures unique ID generation

---

## Example 15: FAILURE MODE - Storage Quota Exceeded

### Test: LocalStorage Error Handling

```javascript
test("FAILURE MODE: should handle localStorage save error", () => {
  // ============ ARRANGE ============
  // Mock localStorage to throw error
  const consoleSpy = jest.spyOn(console, "error").mockImplementation();
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  app.todos = [{ id: 1, name: "Task", priority: "1", status: "not started" }];

  // ============ ACT ============
  const result = app.saveTodos();

  // ============ ASSERT ============
  // Verify error is caught and logged
  expect(result).toBe(false);
  expect(consoleSpy).toHaveBeenCalled();

  // ============ CLEANUP ============
  consoleSpy.mockRestore();
  Storage.prototype.setItem.mockRestore();
});
```

**Why this is a Failure Mode:**

- Tests storage failure scenario
- Verifies error recovery
- Ensures proper error logging

---

## Summary of Test Patterns

### Happy Path Tests

- ✅ Primary use cases
- ✅ Expected inputs
- ✅ Normal workflows
- ✅ Positive scenarios

### Failure Mode Tests

- ❌ Invalid inputs
- ❌ Missing elements
- ❌ Type mismatches
- ❌ Corrupted data
- ❌ Error conditions

### Edge Case Tests

- 🔸 Boundary values
- 🔸 Null/undefined
- 🔸 Empty collections
- 🔸 Special characters
- 🔸 Security vulnerabilities
- 🔸 Unusual but valid inputs

## Best Practices Demonstrated

1. **Clear Separation** - Each AAA section is clearly marked
2. **Single Responsibility** - Each test tests one thing
3. **Descriptive Names** - Test names explain what is tested
4. **Independent Tests** - No test depends on another
5. **Complete Assertions** - All expected outcomes verified
6. **Proper Cleanup** - Mocks are restored after use
7. **Documentation** - Comments explain the "why"

---

**Note**: All 105 tests in the suite follow these patterns consistently, ensuring maintainability and clarity throughout the codebase.
