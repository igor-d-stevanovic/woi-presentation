// Page Object Model for TODO App
class TodoPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.taskNameInput = '#todoName';
    this.statusSelect = '#todoStatus';
    this.priorityRadio = (value) => `input[name="priority"][value="${value}"]`;
    this.addButton = '#addTodoBtn';
    this.todoList = '#todoList';
    this.todoItem = '.todo-item';
    this.deleteButton = (taskName) => `//div[contains(@class, 'todo-item')]//div[contains(text(), '${taskName}')]/following::button[contains(text(), 'Delete')]`;
    this.editControls = '.edit-controls';
    this.saveChangesButton = (taskName) => `//div[contains(@class, 'todo-item')]//div[contains(text(), '${taskName}')]/ancestor::div[contains(@class, 'todo-item')]//button[contains(text(), 'Save Changes')]`;
    this.emptyState = 'p';
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async addTask(name, priority = '1', status = 'not started') {
    await this.page.fill(this.taskNameInput, name);
    await this.page.check(this.priorityRadio(priority));
    await this.page.selectOption(this.statusSelect, status);
    await this.page.click(this.addButton);
    await this.page.waitForTimeout(500); // Wait for API call
  }

  async getTaskByName(name) {
    return this.page.locator(`.todo-item:has-text("${name}")`).first();
  }

  async getTaskCount() {
    return await this.page.locator(this.todoItem).count();
  }

  async clickTask(name) {
    const task = await this.getTaskByName(name);
    await task.click();
  }

  async deleteTask(name, confirm = true) {
    const deleteBtn = this.page.locator(this.deleteButton(name)).first();
    await deleteBtn.click();
    
    this.page.on('dialog', async dialog => {
      if (confirm) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    
    await this.page.waitForTimeout(500);
  }

  async editTask(name, newPriority = null, newStatus = null) {
    await this.clickTask(name);
    await this.page.waitForTimeout(300); // Wait for edit controls to appear
    
    const task = await this.getTaskByName(name);
    
    if (newPriority) {
      const priorityRadio = task.locator(`input[name^="edit-priority"][value="${newPriority}"]`);
      await priorityRadio.check({ force: true }); // Force check even if not visible
    }
    
    if (newStatus) {
      const statusSelect = task.locator('select[id^="edit-status"]');
      await statusSelect.selectOption(newStatus);
    }
    
    const saveButton = task.locator('button:has-text("Save Changes")');
    await saveButton.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async getTaskPriority(name) {
    const task = await this.getTaskByName(name);
    const priorityText = await task.locator('.priority-badge').textContent();
    return priorityText.trim();
  }

  async getTaskStatus(name) {
    const task = await this.getTaskByName(name);
    const statusText = await task.locator('.status-badge').textContent();
    return statusText.trim();
  }

  async getTaskHighlightColor(name) {
    const task = await this.getTaskByName(name);
    const className = await task.getAttribute('class');
    
    if (className.includes('status-highlight-not-started')) return 'red';
    if (className.includes('status-highlight-in-progress')) return 'orange';
    if (className.includes('status-highlight-completed')) return 'green';
    return 'none';
  }

  async isEditControlsVisible(name) {
    const task = await this.getTaskByName(name);
    const editControls = task.locator(this.editControls);
    return await editControls.isVisible();
  }

  async isTaskInEditMode(name) {
    const task = await this.getTaskByName(name);
    const className = await task.getAttribute('class');
    return className.includes('editing');
  }

  async getEmptyStateText() {
    const emptyMsg = this.page.locator('#todoList p, #todoList');
    if (await emptyMsg.count() > 0) {
      return await emptyMsg.first().textContent();
    }
    return '';
  }

  async clearAllTasks() {
    const count = await this.getTaskCount();
    for (let i = 0; i < count; i++) {
      const firstTask = this.page.locator(this.todoItem).first();
      const deleteBtn = firstTask.locator('button:has-text("Delete")');
      
      this.page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async getConsoleMessages() {
    const messages = [];
    this.page.on('console', msg => messages.push(msg.text()));
    return messages;
  }

  async pressEnter() {
    await this.page.keyboard.press('Enter');
  }

  async getAlertMessage() {
    return new Promise((resolve) => {
      this.page.once('dialog', dialog => {
        resolve(dialog.message());
        dialog.accept();
      });
    });
  }
}

module.exports = { TodoPage };
