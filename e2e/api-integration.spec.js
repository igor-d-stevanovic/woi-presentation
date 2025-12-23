const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./page-objects/TodoPage');
const fs = require('fs').promises;
const path = require('path');

test.describe('TO-DO List Application - API Integration', () => {
  let todoPage;
  const tasksFile = path.join(__dirname, '..', 'tasks.json');

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    
    // Clean up tasks.json and reset server state
    try {
      await fs.unlink(tasksFile);
    } catch (err) {
      // File doesn't exist, that's OK
    }
    
    // Wait a bit for file deletion to complete
    await page.waitForTimeout(500);
    
    await todoPage.goto();
    await todoPage.page.waitForTimeout(1000); // Wait for API detection
    
    // Clear any existing tasks from UI
    await todoPage.clearAllTasks();
    await todoPage.page.waitForTimeout(500);
  });

  test('Detect API availability on load', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await todoPage.goto();
    await todoPage.page.waitForTimeout(1000);

    // Check if API detection message appears
    const hasApiMessage = consoleMessages.some(msg => 
      msg.includes('Using API backend') || msg.includes('Loaded') && msg.includes('from API')
    );
    expect(hasApiMessage).toBe(true);
  });

  test('Create task via API', async ({ page }) => {
    // Track network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/tasks')) {
        requests.push({
          method: request.method(),
          url: request.url()
        });
      }
    });

    // When I add a task
    await todoPage.addTask('API Test Task', '2', 'in progress');

    // Then a POST request should be sent
    const postRequest = requests.find(r => r.method === 'POST');
    expect(postRequest).toBeDefined();
    expect(postRequest.url).toContain('/api/tasks');

    // And task should appear in the list
    const task = await todoPage.getTaskByName('API Test Task');
    await expect(task).toBeVisible();

    // And tasks.json should contain the task
    await todoPage.page.waitForTimeout(500);
    const fileContent = await fs.readFile(tasksFile, 'utf8');
    const data = JSON.parse(fileContent);
    expect(data.tasks).toBeDefined();
    expect(data.tasks.length).toBeGreaterThan(0);
    // Just verify a task with that name exists
    const foundTask = data.tasks.find(t => t.name === 'API Test Task');
    expect(foundTask).toBeDefined();
  });

  test('Update task via API', async ({ page }) => {
    // Given I have a task
    await todoPage.addTask('API Task to Update');
    await todoPage.page.waitForTimeout(500);

    // Track PUT requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/tasks') && request.method() === 'PUT') {
        requests.push({
          method: request.method(),
          url: request.url()
        });
      }
    });

    // When I edit the task
    await todoPage.editTask('API Task to Update', null, 'completed');
    await todoPage.page.waitForTimeout(500);

    // Then a PUT request should be sent
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].method).toBe('PUT');
    expect(requests[0].url).toContain('/api/tasks/');

    // And task should be updated in the list
    const status = await todoPage.getTaskStatus('API Task to Update');
    expect(status).toContain('Completed');

    // And tasks.json should reflect the update
    const fileContent = await fs.readFile(tasksFile, 'utf8');
    const data = JSON.parse(fileContent);
    const task = data.tasks.find(t => t.name === 'API Task to Update');
    expect(task.status).toBe('completed');
  });

  test('Delete task via API', async ({ page }) => {
    // Given I have a task
    await todoPage.addTask('API Task to Delete');
    await todoPage.page.waitForTimeout(500);

    // Track DELETE requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/tasks') && request.method() === 'DELETE') {
        requests.push({
          method: request.method(),
          url: request.url()
        });
      }
    });

    // When I delete the task
    page.once('dialog', dialog => dialog.accept());
    await todoPage.deleteTask('API Task to Delete', true);
    await todoPage.page.waitForTimeout(500);

    // Then a DELETE request should be sent
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].method).toBe('DELETE');
    expect(requests[0].url).toContain('/api/tasks/');

    // And task should be removed from list
    const task = todoPage.page.locator('.todo-item:has-text("API Task to Delete")');
    await expect(task).toHaveCount(0);

    // And tasks.json should not contain the task
    const fileContent = await fs.readFile(tasksFile, 'utf8');
    const data = JSON.parse(fileContent);
    const deletedTask = data.tasks.find(t => t.name === 'API Task to Delete');
    expect(deletedTask).toBeUndefined();
  });

  test('Load existing tasks from API on startup', async ({ page }) => {
    // Given the API has tasks stored
    const testData = {
      tasks: [
        { id: 1, name: 'Existing Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Existing Task 2', priority: '2', status: 'in progress' },
        { id: 3, name: 'Existing Task 3', priority: '3', status: 'completed' }
      ],
      nextId: 4
    };
    await fs.writeFile(tasksFile, JSON.stringify(testData, null, 2));

    // Track GET requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/tasks') && request.method() === 'GET') {
        requests.push(request);
      }
    });

    // When I open the application
    await todoPage.goto();
    await todoPage.page.waitForTimeout(1000);

    // Then a GET request should be sent
    expect(requests.length).toBeGreaterThan(0);

    // And all tasks should be loaded
    const count = await todoPage.getTaskCount();
    expect(count).toBe(3);

    // With correct highlighting
    expect(await todoPage.getTaskHighlightColor('Existing Task 1')).toBe('red');
    expect(await todoPage.getTaskHighlightColor('Existing Task 2')).toBe('orange');
    expect(await todoPage.getTaskHighlightColor('Existing Task 3')).toBe('green');
  });

  test('Data persistence after server restart', async ({ page, context }) => {
    // Add tasks
    await todoPage.addTask('Persistent Task 1', '1', 'not started');
    await todoPage.addTask('Persistent Task 2', '2', 'in progress');
    await todoPage.addTask('Persistent Task 3', '3', 'completed');
    await todoPage.page.waitForTimeout(1000);

    // Verify tasks.json was created
    const fileExists = await fs.access(tasksFile).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Simulate "restart" by opening a new page (API server keeps running)
    const newPage = await context.newPage();
    const newTodoPage = new TodoPage(newPage);
    await newTodoPage.goto();
    await newPage.waitForTimeout(1000);

    // Then all tasks should still be visible
    const count = await newTodoPage.getTaskCount();
    expect(count).toBe(3);

    const task1 = await newTodoPage.getTaskByName('Persistent Task 1');
    const task2 = await newTodoPage.getTaskByName('Persistent Task 2');
    const task3 = await newTodoPage.getTaskByName('Persistent Task 3');

    await expect(task1).toBeVisible();
    await expect(task2).toBeVisible();
    await expect(task3).toBeVisible();

    // Verify data integrity
    expect(await newTodoPage.getTaskHighlightColor('Persistent Task 1')).toBe('red');
    expect(await newTodoPage.getTaskHighlightColor('Persistent Task 2')).toBe('orange');
    expect(await newTodoPage.getTaskHighlightColor('Persistent Task 3')).toBe('green');

    await newPage.close();
  });

  test('Multiple operations in sequence', async () => {
    // Create
    await todoPage.addTask('Sequence Task', '1', 'not started');
    await todoPage.page.waitForTimeout(500);
    
    let count = await todoPage.getTaskCount();
    expect(count).toBe(1);

    // Update
    await todoPage.editTask('Sequence Task', '3', 'in progress');
    await todoPage.page.waitForTimeout(500);
    
    expect(await todoPage.getTaskPriority('Sequence Task')).toContain('3');
    expect(await todoPage.getTaskStatus('Sequence Task')).toContain('In Progress');

    // Update again
    await todoPage.editTask('Sequence Task', null, 'completed');
    await todoPage.page.waitForTimeout(500);
    
    expect(await todoPage.getTaskStatus('Sequence Task')).toContain('Completed');

    // Delete
    todoPage.page.once('dialog', dialog => dialog.accept());
    await todoPage.deleteTask('Sequence Task', true);
    await todoPage.page.waitForTimeout(500);

    count = await todoPage.getTaskCount();
    expect(count).toBe(0);
  });

  test('Bulk operations - Multiple creates and deletes', async ({ page }) => {
    // Create multiple tasks
    for (let i = 1; i <= 5; i++) {
      await todoPage.addTask(`Bulk Task ${i}`, String((i % 3) + 1), 'not started');
      await todoPage.page.waitForTimeout(300);
    }

    let count = await todoPage.getTaskCount();
    expect(count).toBe(5);

    // Delete first 3 tasks
    for (let i = 1; i <= 3; i++) {
      page.once('dialog', dialog => dialog.accept());
      await todoPage.deleteTask(`Bulk Task ${i}`, true);
      await todoPage.page.waitForTimeout(300);
    }

    count = await todoPage.getTaskCount();
    expect(count).toBe(2);

    // Verify remaining tasks
    const task4 = await todoPage.getTaskByName('Bulk Task 4');
    const task5 = await todoPage.getTaskByName('Bulk Task 5');
    
    await expect(task4).toBeVisible();
    await expect(task5).toBeVisible();
  });
});
