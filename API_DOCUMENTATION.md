# TODO List API Documentation

## Overview

RESTful API for managing TODO tasks with persistent storage using Node.js and Express.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. GET /api/tasks

Get all existing tasks.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Task name",
      "status": "not started",
      "priority": "1"
    }
  ],
  "count": 1
}
```

### 2. GET /api/tasks/:id

Get a specific task by ID.

**Parameters:**

- `id` (number) - Task ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Task name",
    "status": "not started",
    "priority": "1"
  }
}
```

### 3. POST /api/tasks

Create a new task with a specific status.

**Request Body:**

```json
{
  "name": "Task name",
  "status": "not started", // "not started", "in progress", or "completed"
  "priority": "1" // "1", "2", or "3"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Task name",
    "status": "not started",
    "priority": "1"
  },
  "message": "Task created successfully"
}
```

### 4. PUT /api/tasks/:id

Update (edit) an existing task.

**Parameters:**

- `id` (number) - Task ID

**Request Body:**

```json
{
  "name": "Updated task name",
  "status": "in progress",
  "priority": "2"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated task name",
    "status": "in progress",
    "priority": "2"
  },
  "message": "Task updated successfully"
}
```

### 5. DELETE /api/tasks/:id

Delete a selected task.

**Parameters:**

- `id` (number) - Task ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Deleted task",
    "status": "completed",
    "priority": "3"
  },
  "message": "Task deleted successfully"
}
```

## Data Validation

### Task Name

- Required
- Must be a string
- Cannot be empty or whitespace only
- Maximum length: 200 characters
- Whitespace is trimmed automatically

### Priority

- Must be "1" (Low), "2" (Medium), or "3" (High)
- Default: "1"

### Status

- Must be one of: "not started", "in progress", "completed"
- Default: "not started"

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "errors": ["Error message 1", "Error message 2"]
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Task not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Error message"
}
```

## Storage

- Tasks are persisted to `tasks.json` file
- Data survives server restarts
- Automatic file creation on first write

## Running the Server

### Start the server:

```bash
npm start
```

### Run API tests:

```bash
npm run test:api
```

### Run all tests (unit + API):

```bash
npm test
```

## Example Usage with cURL

### Create a task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"My new task","status":"not started","priority":"2"}'
```

### Get all tasks:

```bash
curl http://localhost:3000/api/tasks
```

### Update a task:

```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### Delete a task:

```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

## Example Usage with JavaScript fetch()

### Create a task:

```javascript
fetch("http://localhost:3000/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "My new task",
    status: "not started",
    priority: "2",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Get all tasks:

```javascript
fetch("http://localhost:3000/api/tasks")
  .then((response) => response.json())
  .then((data) => console.log(data.data));
```

### Update a task:

```javascript
fetch("http://localhost:3000/api/tasks/1", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "completed" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Delete a task:

```javascript
fetch("http://localhost:3000/api/tasks/1", {
  method: "DELETE",
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Test Coverage

- 44 comprehensive API tests
- Tests cover:
  - Happy paths
  - Failure modes
  - Edge cases
  - Complete CRUD workflows
  - Data persistence
  - Bulk operations

## Notes

- All timestamps use ISO 8601 format
- Task IDs are auto-incremented integers
- CORS is enabled for all origins
- Server serves static files from root directory
- Frontend can access API at http://localhost:3000 when server is running
