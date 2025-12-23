const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./page-objects/TodoPage');

test.describe('TO-DO List Application - Basic Functionality', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.clearAllTasks(); // Clean slate for each test
  });

  test('Add a new task with default values', async () => {
    // Given I am on the TO-DO list page
    // When I enter "Buy groceries" in the task name field
    await todoPage.addTask('Buy groceries');

    // Then I should see a new task "Buy groceries" in the list
    const task = await todoPage.getTaskByName('Buy groceries');
    await expect(task).toBeVisible();

    // And the task should have priority "1 (Low)"
    const priority = await todoPage.getTaskPriority('Buy groceries');
    expect(priority).toContain('1');
    expect(priority).toContain('Low');

    // And the task should have status "Not Started"
    const status = await todoPage.getTaskStatus('Buy groceries');
    expect(status.toLowerCase()).toContain('not started');

    // And the task should be highlighted in red
    const color = await todoPage.getTaskHighlightColor('Buy groceries');
    expect(color).toBe('red');
  });

  test('Add a task with high priority and in progress status', async () => {
    // When I enter "Complete project presentation" with priority 3 and status "in progress"
    await todoPage.addTask('Complete project presentation', '3', 'in progress');

    // Then I should see the task in the list
    const task = await todoPage.getTaskByName('Complete project presentation');
    await expect(task).toBeVisible();

    // And the task should have priority "3 (High)"
    const priority = await todoPage.getTaskPriority('Complete project presentation');
    expect(priority).toContain('3');
    expect(priority).toContain('High');

    // And the task should have status "In Progress"
    const status = await todoPage.getTaskStatus('Complete project presentation');
    expect(status.toLowerCase()).toContain('in progress');

    // And the task should be highlighted in orange
    const color = await todoPage.getTaskHighlightColor('Complete project presentation');
    expect(color).toBe('orange');
  });

  test('Edit task priority and status', async ({ page }) => {
    // Given I have a task "Write documentation"
    await todoPage.addTask('Write documentation', '1', 'not started');

    // When I click on the task
    await todoPage.clickTask('Write documentation');

    // Then the edit controls should be displayed
    const editControlsVisible = await todoPage.isEditControlsVisible('Write documentation');
    expect(editControlsVisible).toBe(true);

    // When I change priority to 2 and status to "in progress"
    await todoPage.editTask('Write documentation', '2', 'in progress');

    // Then the task should have updated values
    const priority = await todoPage.getTaskPriority('Write documentation');
    expect(priority).toContain('2');
    expect(priority).toContain('Medium');

    const status = await todoPage.getTaskStatus('Write documentation');
    expect(status).toContain('In Progress');

    // And should be highlighted in orange
    const color = await todoPage.getTaskHighlightColor('Write documentation');
    expect(color).toBe('orange');
  });

  test('Delete a task with confirmation', async ({ page }) => {
    // Given I have a task "Old task to delete"
    await todoPage.addTask('Old task to delete');
    const initialCount = await todoPage.getTaskCount();

    // When I click delete and confirm
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this item?');
      dialog.accept();
    });

    await todoPage.deleteTask('Old task to delete', true);

    // Then the task should be removed
    const task = todoPage.page.locator('.todo-item:has-text("Old task to delete")');
    await expect(task).toHaveCount(0);

    // And the count should decrease
    const finalCount = await todoPage.getTaskCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('Cancel task deletion', async ({ page }) => {
    // Given I have a task "Important task"
    await todoPage.addTask('Important task');
    const initialCount = await todoPage.getTaskCount();

    // When I click delete and cancel
    page.once('dialog', dialog => dialog.dismiss());

    const deleteBtn = todoPage.page.locator('//div[contains(@class, "todo-item")]//div[contains(text(), "Important task")]/following::button[contains(text(), "Delete")]').first();
    await deleteBtn.click();

    await todoPage.page.waitForTimeout(300);

    // Then the task should still be visible
    const task = await todoPage.getTaskByName('Important task');
    await expect(task).toBeVisible();

    // And count should remain unchanged
    const finalCount = await todoPage.getTaskCount();
    expect(finalCount).toBe(initialCount);
  });

  test('Toggle edit mode on and off', async () => {
    // Given I have a task "Sample task"
    await todoPage.addTask('Sample task');

    // When I click on the task
    await todoPage.clickTask('Sample task');

    // Then edit controls should be displayed
    let editControlsVisible = await todoPage.isEditControlsVisible('Sample task');
    expect(editControlsVisible).toBe(true);

    // And task should be in editing mode
    let isEditing = await todoPage.isTaskInEditMode('Sample task');
    expect(isEditing).toBe(true);

    // When I click again
    await todoPage.clickTask('Sample task');

    // Then edit controls should be hidden
    editControlsVisible = await todoPage.isEditControlsVisible('Sample task');
    expect(editControlsVisible).toBe(false);

    // And task should not be in editing mode
    isEditing = await todoPage.isTaskInEditMode('Sample task');
    expect(isEditing).toBe(false);
  });

  test('Add multiple tasks with different priorities', async () => {
    // When I add multiple tasks
    await todoPage.addTask('Low priority task', '1', 'not started');
    await todoPage.addTask('Medium priority task', '2', 'not started');
    await todoPage.addTask('High priority task', '3', 'not started');

    // Then I should see 3 tasks
    const count = await todoPage.getTaskCount();
    expect(count).toBe(3);

    // And all should have different priorities
    const lowPriority = await todoPage.getTaskPriority('Low priority task');
    const medPriority = await todoPage.getTaskPriority('Medium priority task');
    const highPriority = await todoPage.getTaskPriority('High priority task');

    expect(lowPriority).toContain('1');
    expect(medPriority).toContain('2');
    expect(highPriority).toContain('3');

    // And all should be highlighted in red (not started)
    expect(await todoPage.getTaskHighlightColor('Low priority task')).toBe('red');
    expect(await todoPage.getTaskHighlightColor('Medium priority task')).toBe('red');
    expect(await todoPage.getTaskHighlightColor('High priority task')).toBe('red');
  });

  test('Task status color highlighting', async () => {
    // When I add tasks with different statuses
    await todoPage.addTask('Not Started Task', '1', 'not started');
    await todoPage.addTask('In Progress Task', '1', 'in progress');
    await todoPage.addTask('Completed Task', '1', 'completed');

    // Then each should have correct color
    expect(await todoPage.getTaskHighlightColor('Not Started Task')).toBe('red');
    expect(await todoPage.getTaskHighlightColor('In Progress Task')).toBe('orange');
    expect(await todoPage.getTaskHighlightColor('Completed Task')).toBe('green');
  });

  test('Validate empty task name', async ({ page }) => {
    // When I leave task name empty and click add
    page.once('dialog', dialog => {
      expect(dialog.message()).toBe('Please enter a task name!');
      dialog.accept();
    });

    await todoPage.page.click(todoPage.addButton);
    await todoPage.page.waitForTimeout(300);

    // Then no task should be added
    const count = await todoPage.getTaskCount();
    expect(count).toBe(0);
  });

  test('Validate task name with only whitespace', async ({ page }) => {
    // When I enter only spaces
    await todoPage.page.fill(todoPage.taskNameInput, '   ');

    page.once('dialog', dialog => {
      expect(dialog.message()).toBe('Please enter a task name!');
      dialog.accept();
    });

    await todoPage.page.click(todoPage.addButton);
    await todoPage.page.waitForTimeout(300);

    // Then no task should be added
    const count = await todoPage.getTaskCount();
    expect(count).toBe(0);
  });

  test('Validate maximum task name length', async ({ page }) => {
    // When I enter 201 characters
    const longName = 'a'.repeat(201);
    await todoPage.page.fill(todoPage.taskNameInput, longName);

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Task name is too long!');
      expect(dialog.message()).toContain('200 characters');
      dialog.accept();
    });

    await todoPage.page.click(todoPage.addButton);
    await todoPage.page.waitForTimeout(300);

    // Then no task should be added
    const count = await todoPage.getTaskCount();
    expect(count).toBe(0);
  });

  test('Add task with exactly 200 characters', async () => {
    // When I enter exactly 200 characters
    const maxName = 'a'.repeat(200);
    await todoPage.addTask(maxName);

    // Then task should be added successfully
    const count = await todoPage.getTaskCount();
    expect(count).toBe(1);

    const task = todoPage.page.locator(`.todo-item:has-text("${'a'.repeat(50)}")`); // Check partial match
    await expect(task).toBeVisible();
  });

  test('Add task using Enter key', async ({ page }) => {
    // When I enter task name and press Enter
    await todoPage.page.fill(todoPage.taskNameInput, 'Quick task');
    await todoPage.page.focus(todoPage.taskNameInput);
    await todoPage.pressEnter();
    await todoPage.page.waitForTimeout(500);

    // Then task should be added
    const task = await todoPage.getTaskByName('Quick task');
    await expect(task).toBeVisible();

    // With default values
    const priority = await todoPage.getTaskPriority('Quick task');
    expect(priority).toContain('1');

    const status = await todoPage.getTaskStatus('Quick task');
    expect(status.toLowerCase()).toContain('not started');
  });

  test('Handle special characters in task name', async () => {
    // When I enter special characters including script tags
    const specialName = '<script>alert("XSS")</script>';
    await todoPage.addTask(specialName);

    // Then task should be added and HTML escaped
    const taskCount = await todoPage.getTaskCount();
    expect(taskCount).toBeGreaterThan(0);

    // Verify via direct DOM query
    const taskName = await todoPage.page.locator('.todo-name').first().textContent();
    expect(taskName).toBe(specialName);
  });

  test('Handle unicode characters in task name', async () => {
    // When I enter unicode characters
    const unicodeName = '测试任务 🚀 Task with émojis';
    await todoPage.addTask(unicodeName);

    // Then task should display correctly
    const task = await todoPage.getTaskByName(unicodeName);
    await expect(task).toBeVisible();

    const taskName = task.locator('.todo-name');
    const text = await taskName.textContent();
    expect(text).toBe(unicodeName);
  });

  test('Empty state display', async () => {
    // Given the list is empty (cleared in beforeEach)
    const count = await todoPage.getTaskCount();
    expect(count).toBe(0);

    // Then empty state should be visible
    const emptyText = await todoPage.getEmptyStateText();
    expect(emptyText).toContain('No tasks yet');
  });

  test('Complete workflow - Add, Edit, Complete, Delete', async ({ page }) => {
    // Add task with medium priority
    await todoPage.addTask('Workflow test task', '2', 'not started');
    expect(await todoPage.getTaskHighlightColor('Workflow test task')).toBe('red');

    // Change to in progress
    await todoPage.editTask('Workflow test task', null, 'in progress');
    expect(await todoPage.getTaskHighlightColor('Workflow test task')).toBe('orange');

    // Change to completed
    await todoPage.editTask('Workflow test task', null, 'completed');
    expect(await todoPage.getTaskHighlightColor('Workflow test task')).toBe('green');

    // Delete the task
    page.once('dialog', dialog => dialog.accept());
    await todoPage.deleteTask('Workflow test task', true);

    // Verify removed
    const task = todoPage.page.locator('.todo-item:has-text("Workflow test task")');
    await expect(task).toHaveCount(0);
  });

  test('Switch between edit modes for multiple tasks', async () => {
    // Given I have two tasks
    await todoPage.addTask('Task A');
    await todoPage.addTask('Task B');

    // When I click Task A
    await todoPage.clickTask('Task A');
    expect(await todoPage.isEditControlsVisible('Task A')).toBe(true);

    // When I click Task B
    await todoPage.clickTask('Task B');
    expect(await todoPage.isEditControlsVisible('Task B')).toBe(true);

    // Then Task A should no longer be in edit mode
    expect(await todoPage.isEditControlsVisible('Task A')).toBe(false);

    // Only Task B should be in edit mode
    expect(await todoPage.isTaskInEditMode('Task A')).toBe(false);
    expect(await todoPage.isTaskInEditMode('Task B')).toBe(true);
  });
});
