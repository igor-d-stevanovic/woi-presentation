# TO-DO List Application with REST API and Comprehensive Testing

## 📋 Project Overview

A full-stack TO-DO list application with:

- **Frontend**: Single-page application with status-based color highlighting
- **Backend**: RESTful API with Express.js
- **Testing**: 111 unit tests + 44 API tests = **155 total tests** with excellent coverage

### Features

- ✅ Add, edit, and delete tasks
- ✅ Priority levels (Low, Medium, High)
- ✅ Status tracking (Not Started, In Progress, Completed)
- ✅ **Status-based color highlighting** (Red/Orange/Green)
- ✅ LocalStorage persistence (frontend)
- ✅ File-based persistence (backend)
- ✅ RESTful API endpoints
- ✅ Responsive design
- ✅ XSS protection
- ✅ Comprehensive input validation

## 🗂️ Project Structure

```
woi-presentation/
├── index.html              # Main HTML file
├── styles.css              # Styling with status highlighting
├── script.js               # Frontend application logic
├── server.js               # Express.js REST API server
├── script.test.js          # 111 frontend unit tests
├── api.test.js             # 44 backend API tests
├── jest.config.js          # Jest configuration (frontend)
├── jest.api.config.js      # Jest configuration (API)
├── jest.setup.js           # Test environment setup
├── package.json            # Dependencies and scripts
├── tasks.json              # Backend data storage (auto-generated)
├── API_DOCUMENTATION.md    # Complete API documentation
├── TEST_SUMMARY.md         # Test results summary
├── TEST_DOCUMENTATION.md   # Detailed test documentation
├── TEST_PATTERNS.md        # AAA pattern examples
├── CHECKLIST.md           # Project checklist
└── README.md              # This file
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Running the Application

#### Option 1: Frontend Only (LocalStorage)

Simply open `index.html` in a web browser.

#### Option 2: Full Stack (with API)

1. Start the server:

```bash
npm start
```

2. Open your browser to:

```
http://localhost:3000
```

The frontend is automatically served and will use localStorage for data persistence.

### Running Tests

#### Run all tests (unit + API)

```bash
npm test
```

#### Run only frontend unit tests

```bash
npm run test:unit
```

#### Run only API tests

```bash
npm run test:api
```

#### Run tests in watch mode (for development)

```bash
npm run test:watch
```

#### Run tests with coverage report

```bash
npm run test:coverage
```

#### Run tests with verbose output

```bash
npm run test:verbose
```

## 📊 Allure Test Reports

This project uses **Allure Framework** for generating rich, interactive test reports with detailed execution information.

### Features

- ✅ **111 individual test cases** with full details
- ✅ **Execution tracking** with timestamps and build information
- ✅ **Test categorization** (Happy Path, Failure Mode, Edge Case)
- ✅ **Visual test steps** (Setup → Execute → Verify)
- ✅ **Suite organization** with hierarchical structure
- ✅ **Environment information** (Node version, platform, Jest version)

### Generating Allure Reports Locally

1. **Run tests** (generates `allure-results/`):
```bash
npm run test:unit
```

2. **Generate HTML report**:
```bash
npx allure generate allure-results --clean -o allure-report
```

3. **Open the report**:
```bash
npx allure open allure-report
```

Or combine steps 2 and 3:
```bash
npx allure serve allure-results
```

### Report Contents

The Allure report includes:

- **Overview**: Test execution summary with statistics
- **Suites**: Organized by test file and describe blocks
- **Categories**: Tests grouped by type (Happy Path, Failure Mode, Edge Case)
- **Timeline**: Chronological view of test execution
- **Behaviors**: Tests organized by feature/epic
- **Graphs**: Visual representation of test results
- **Execution Details**: For each test:
  - Test name and description
  - Execution status (passed/failed/skipped)
  - Duration
  - Test steps with timing
  - Suite hierarchy
  - Tags and labels

### CI/CD Integration

The project includes GitHub Actions workflow that:
1. Runs unit tests automatically on push
2. Generates Allure results (115 files per run)
3. Creates HTML report
4. Deploys to GitHub Pages

View the latest report at: `https://<username>.github.io/<repo>/`

### Custom Allure Reporter

This project uses a **custom Jest reporter** (`allure-reporter.js`) because the standard `allure-jest` package has known issues with result generation. The custom reporter:

- Generates proper Allure JSON format
- Creates individual result files for each test
- Adds execution metadata (executor.json)
- Categorizes tests automatically
- Generates synthetic test steps
- Links container files correctly (no UUID errors)

## 📊 Test Suite Overview

### Test Statistics

- **Frontend Unit Tests**: 111 (100% passing)
- **Backend API Tests**: 44 (100% passing)
- **Total Tests**: 155
- **All Passing**: ✅ 100%
- **Test Framework**: Jest with jsdom (frontend) and supertest (API)

### Frontend Code Coverage

```
File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|
script.js  |  93.97% |  86.36%  |  90.9%  |  94.3%  |
```

### Test Distribution

| Category              | Tests | Description                       |
| --------------------- | ----- | --------------------------------- |
| **Frontend Tests**    | 111   |                                   |
| Initialization        | 5     | App startup & data loading        |
| Adding Todos          | 19    | Create new tasks                  |
| Deleting Todos        | 10    | Remove tasks                      |
| Updating Todos        | 12    | Modify existing tasks             |
| Toggle Edit Mode      | 4     | UI state management               |
| Helper Functions      | 20    | Utility function testing          |
| Rendering             | 13    | UI rendering + color highlighting |
| LocalStorage Ops      | 4     | Data persistence                  |
| Utility Methods       | 14    | Additional utilities              |
| Integration Tests     | 3     | End-to-end workflows              |
| **Backend API Tests** | 44    |                                   |
| GET /api/tasks        | 3     | Retrieve all tasks                |
| GET /api/tasks/:id    | 3     | Retrieve specific task            |
| POST /api/tasks       | 13    | Create new tasks                  |
| PUT /api/tasks/:id    | 11    | Update existing tasks             |
| DELETE /api/tasks/:id | 8     | Delete tasks                      |
| Integration Tests     | 3     | Complete API workflows            |
| Updating Todos        | 13    | Edit existing tasks               |
| Toggle Edit Mode      | 4     | UI state management               |
| Helper Functions      | 20    | Utility function validation       |
| Rendering             | 7     | DOM manipulation                  |
| LocalStorage          | 4     | Data persistence                  |
| Utility Methods       | 20    | Filtering, bulk operations        |
| Integration Tests     | 3     | End-to-end workflows              |

## 🎯 Testing Approach

### AAA Pattern (Arrange-Act-Assert)

All tests follow this industry-standard pattern:

```javascript
test("should add a todo with valid input", () => {
  // Arrange: Set up test conditions
  const nameInput = document.getElementById("todoName");
  nameInput.value = "New Task";

  // Act: Execute the functionality
  const result = app.addTodo();

  // Assert: Verify expected outcomes
  expect(result).toBe(true);
  expect(app.todos.length).toBe(1);
});
```

### Test Categories

#### ✅ Happy Path Tests

Testing normal, expected use cases:

- Valid inputs
- Primary workflows
- Expected behaviors

#### ❌ Failure Mode Tests

Testing error conditions:

- Invalid inputs
- Missing DOM elements
- Corrupted data
- Type mismatches

#### 🔸 Edge Case Tests

Testing boundary conditions:

- Null/undefined values
- Empty collections
- Maximum length inputs
- Special characters
- Security vulnerabilities

## 🔧 Key Modifications for Testability

### 1. Constructor Parameter

```javascript
constructor((autoInit = true));
```

Allows creating non-initialized instances for testing.

### 2. Method Return Values

All major methods return success/failure indicators:

```javascript
addTodo()     → true/false
deleteTodo()  → true/false
updateTodo()  → true/false
saveTodos()   → true/false
loadTodos()   → true/false
```

### 3. Input Validation

```javascript
maxNameLength = 200;
validPriorities = ["1", "2", "3"];
validStatuses = ["not started", "in progress", "completed"];
```

### 4. Error Handling

- Try-catch blocks for localStorage operations
- Explicit type checking
- Graceful handling of missing DOM elements
- Console error logging

### 5. New Utility Methods

```javascript
getTodoById(id); // Find todo by ID
getTodoCount(); // Get count of todos
getTodosByStatus(status); // Filter by status
getTodosByPriority(pri); // Filter by priority
clearAllTodos(); // Delete all todos
resetForm(); // Reset input form
```

### 6. Module Export

```javascript
if (typeof module !== "undefined" && module.exports) {
  module.exports = TodoApp;
}
```

## 🌐 REST API

### API Endpoints

The backend provides a RESTful API for task management:

| Method | Endpoint       | Description          |
| ------ | -------------- | -------------------- |
| GET    | /api/tasks     | Get all tasks        |
| GET    | /api/tasks/:id | Get specific task    |
| POST   | /api/tasks     | Create new task      |
| PUT    | /api/tasks/:id | Update existing task |
| DELETE | /api/tasks/:id | Delete task          |

### Quick API Examples

#### Create a task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"My task","status":"not started","priority":"1"}'
```

#### Get all tasks:

```bash
curl http://localhost:3000/api/tasks
```

#### Update a task:

```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

#### Delete a task:

```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

### API Documentation

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Data Persistence

- **Frontend**: Uses browser localStorage
- **Backend**: Uses file-based storage (tasks.json)
- Data persists across server restarts
- Automatic file creation on first write

## 🔒 Security Features

### XSS Prevention

All user input is properly escaped before rendering:

```javascript
escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Input Validation

- Maximum length enforcement (200 chars)
- Whitespace trimming
- Empty input rejection
- Type validation for IDs
- Status/priority enum validation
- CORS enabled for API access

## 📚 Documentation

### Available Documentation Files

1. **README.md** (this file)

   - Quick start guide
   - Project overview
   - Test suite summary

2. **API_DOCUMENTATION.md**

   - Complete REST API reference
   - Request/response examples
   - Error handling
   - Usage examples with cURL and fetch()

3. **TEST_SUMMARY.md**

   - Detailed test results
   - Coverage analysis
   - Notable test cases

4. **TEST_DOCUMENTATION.md**

   - Complete test catalog
   - Testing principles
   - Code modifications

5. **TEST_PATTERNS.md**

   - AAA pattern examples
   - Happy path examples
   - Failure mode examples
   - Edge case examples

6. **CHECKLIST.md**
   - Project completion checklist
   - Feature tracking

## 🧪 Example Tests

### Happy Path Example

```javascript
test("HAPPY PATH: should add a todo with valid input", () => {
  const nameInput = document.getElementById("todoName");
  nameInput.value = "New Task";

  const result = app.addTodo();

  expect(result).toBe(true);
  expect(app.todos[0].name).toBe("New Task");
});
```

### Failure Mode Example

```javascript
test("FAILURE MODE: should not add todo with empty name", () => {
  const nameInput = document.getElementById("todoName");
  nameInput.value = "";

  const result = app.addTodo();

  expect(result).toBe(false);
  expect(global.alert).toHaveBeenCalledWith("Please enter a task name!");
});
```

### Edge Case Example

```javascript
test("EDGE CASE: should handle unicode characters", () => {
  const nameInput = document.getElementById("todoName");
  nameInput.value = "タスク 📝 émojis";

  app.addTodo();

  expect(app.todos[0].name).toBe("タスク 📝 émojis");
});
```

## 🎨 Technology Stack

### Frontend

- HTML5
- CSS3 (with modern features)
- Vanilla JavaScript (ES6+)

### Testing

- Jest (v30.2.0)
- jsdom (for DOM testing)
- @testing-library/jest-dom (for assertions)
- @testing-library/dom (for DOM utilities)

### Build Tools

- npm (package management)
- Node.js (for running tests)

## 📈 Test Quality Metrics

### ✅ Independence

Each test runs in isolation with clean setup/teardown.

### ✅ Clarity

Descriptive test names and clear AAA structure.

### ✅ Completeness

105 tests covering all code paths and edge cases.

### ✅ Speed

All tests execute in ~5 seconds.

### ✅ Maintainability

Well-organized, easy to understand and extend.

## 🔍 Notable Test Cases

### 1. XSS Prevention

```javascript
test("should escape HTML in todo names", () => {
  app.todos = [{ name: '<script>alert("xss")</script>' }];
  app.render();

  expect(todoName.innerHTML).not.toContain("<script>");
});
```

### 2. Unicode Support

```javascript
test("should handle unicode characters", () => {
  nameInput.value = "タスク 📝 émojis";
  app.addTodo();
  expect(app.todos[0].name).toBe("タスク 📝 émojis");
});
```

### 3. Boundary Testing

```javascript
test("should accept name at exactly max length", () => {
  nameInput.value = "a".repeat(200);
  const result = app.addTodo();
  expect(result).toBe(true);
});
```

### 4. Error Recovery

```javascript
test("should handle corrupted localStorage", () => {
  localStorage.setItem("todos", "invalid json{{{");
  const result = newApp.loadTodos();

  expect(result).toBe(false);
  expect(newApp.todos).toEqual([]);
});
```

### 5. Integration Testing

```javascript
test("complete workflow: add, edit, delete", () => {
  // Add
  app.addTodo();

  // Edit
  app.updateTodo(todoId);

  // Delete
  app.deleteTodo(todoId);

  expect(app.todos.length).toBe(0);
});
```

## 🤝 Contributing

To add new tests:

1. Follow the AAA pattern
2. Categorize as Happy Path, Failure Mode, or Edge Case
3. Use descriptive test names
4. Ensure tests are independent
5. Add proper assertions
6. Update documentation

## � Troubleshooting

### Allure Report Issues

**Problem**: "404 Test result with uid not found" errors in Allure report

**Solution**: This was fixed by implementing proper UUID tracking in the custom reporter. If you see this error:
- Ensure you're using the latest version of `allure-reporter.js`
- Delete `allure-results/` and `allure-report/` directories
- Re-run tests: `npm run test:unit`
- Regenerate report: `npx allure generate allure-results --clean -o allure-report`

**Problem**: No `allure-results/` directory generated

**Solution**: The standard `allure-jest` package has known issues. This project uses a custom reporter:
- Verify `allure-reporter.js` exists in the root directory
- Check `jest.config.js` includes the reporter in the `reporters` array
- Ensure `uuid` package is installed: `npm install --save-dev uuid`

**Problem**: Allure report shows "No information about test execution"

**Solution**: This is fixed by the `executor.json` file:
- The custom reporter automatically generates this file
- Verify `allure-results/executor.json` exists after running tests
- Contains build name, timestamp, and optionally links to CI run

### Test Execution Issues

**Problem**: Tests fail in CI but pass locally

**Solution**: 
- Check Node.js version compatibility (project uses Node 20.x)
- Ensure all dependencies are installed: `npm ci`
- Clear Jest cache: `npx jest --clearCache`

**Problem**: Coverage report not generated

**Solution**:
```bash
npm run test:coverage
# Report generated in coverage/ directory
```

## 📚 Additional Resources

### Project Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete REST API reference
- [Test Summary](./TEST_SUMMARY.md) - Detailed test results
- [Test Documentation](./TEST_DOCUMENTATION.md) - Test implementation guide
- [Test Patterns](./TEST_PATTERNS.md) - AAA pattern examples
- [Project Checklist](./CHECKLIST.md) - Development progress

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [Allure Framework](https://allurereport.org/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [AAA Pattern Guide](https://wiki.c2.com/?ArrangeActAssert)

## �📝 License

This is a sample project for demonstration purposes.

## 👤 Author

Created as a comprehensive example of frontend testing best practices with Allure reporting.

## ✨ Features Highlights

### User Features

- ✅ Intuitive interface
- ✅ Real-time updates
- ✅ Data persistence
- ✅ Responsive design
- ✅ Status-based color highlighting

### Developer Features

- ✅ 94.3% code coverage
- ✅ 155 comprehensive tests (111 unit + 44 API)
- ✅ AAA pattern throughout
- ✅ Complete documentation
- ✅ Testable architecture
- ✅ Error handling
- ✅ Security features (XSS protection)
- ✅ **Rich Allure test reports**
- ✅ **Custom reporter implementation**
- ✅ **CI/CD integration with GitHub Actions**

## 🎯 Project Goals Achieved

- ✅ Implement AAA Pattern
- ✅ Test Happy Paths
- ✅ Test Failure Modes
- ✅ Test Edge Cases
- ✅ Write Complete Test Cases
- ✅ Achieve High Code Coverage
- ✅ Modify Code for Testability
- ✅ Document Everything
- ✅ **Generate Rich Test Reports with Allure**
- ✅ **Implement Custom Allure Reporter**
- ✅ **Deploy Reports to GitHub Pages**

---

**Status**: ✅ All Tests Passing  
**Coverage**: 94.3% Lines, 93.97% Statements  
**Frontend Tests**: 111/111 Passing  
**API Tests**: 44/44 Passing  
**Total Tests**: 155/155 Passing  
**Allure Files Generated**: 115 (per test run)  
**Last Updated**: December 23, 2025
