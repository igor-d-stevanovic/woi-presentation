/**
 * @jest-environment jsdom
 * 
 * Comprehensive Test Suite for TodoApp
 * Following AAA Pattern (Arrange, Act, Assert)
 * Testing: Happy paths, Failure modes, Edge cases
 */

const fs = require('fs');
const path = require('path');

// Load HTML and TodoApp class
const htmlContent = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
// Remove all script tags to prevent auto-execution in jsdom
const html = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
const TodoApp = require('./script.js');

describe('TodoApp - Comprehensive Test Suite', () => {
  let app;

  beforeEach(() => {
  // Arrange: Set up DOM
  document.documentElement.innerHTML = html;
    localStorage.clear();
    jest.clearAllMocks();
    
  // Reset fetch mock to simulate API unavailable (resolved but not ok)
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ data: [] }) });
    
    // Create app without auto-init for controlled testing and force local storage mode
    app = new TodoApp(false);
    app.useApi = false;
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
  });

  // ============================================
  // INITIALIZATION TESTS
  // ============================================
  describe('Initialization', () => {
    
    test('HAPPY PATH: should initialize with default values', () => {
      // Arrange - done in beforeEach
      
      // Act
      const newApp = new TodoApp(false);
      
      // Assert
      expect(newApp.todos).toEqual([]);
      expect(newApp.currentEditingId).toBeNull();
      expect(newApp.maxNameLength).toBe(200);
      expect(newApp.validPriorities).toEqual(['1', '2', '3']);
      expect(newApp.validStatuses).toEqual(['not started', 'in progress', 'completed']);
    });

    test('HAPPY PATH: should load existing todos from localStorage on init', () => {
      // Arrange
      const mockTodos = [
        { id: 1, name: 'Test Task', priority: '2', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '3', status: 'in progress' }
      ];
      localStorage.setItem('todos', JSON.stringify(mockTodos));
      
      // Act
      const newApp = new TodoApp(false);
      newApp.loadTodos();
      
      // Assert
      expect(newApp.todos).toEqual(mockTodos);
      expect(newApp.todos.length).toBe(2);
    });

    test('FAILURE MODE: should handle corrupted localStorage data gracefully', () => {
      // Arrange
      localStorage.setItem('todos', 'invalid json{{{');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      const newApp = new TodoApp(false);
      const result = newApp.loadTodos();
      
      // Assert
      expect(result).toBe(false);
      expect(newApp.todos).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('EDGE CASE: should handle non-array data in localStorage', () => {
      // Arrange
      localStorage.setItem('todos', JSON.stringify({ not: 'an array' }));
      
      // Act
      const newApp = new TodoApp(false);
      newApp.loadTodos();
      
      // Assert
      expect(newApp.todos).toEqual([]);
    });

    test('EDGE CASE: should handle null/undefined localStorage gracefully', () => {
      // Arrange
      localStorage.clear();
      
      // Act
      const newApp = new TodoApp(false);
      const result = newApp.loadTodos();
      
      // Assert
      expect(result).toBe(false);
      expect(newApp.todos).toEqual([]);
    });
  });

  // ============================================
  // ADD TODO TESTS
  // ============================================
  describe('Adding Todos', () => {
    
    test('HAPPY PATH: should add a todo with valid input', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const statusSelect = document.getElementById('todoStatus');
      nameInput.value = 'New Task';
      statusSelect.value = 'not started';
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos.length).toBe(1);
      expect(app.todos[0].name).toBe('New Task');
      expect(app.todos[0].priority).toBe('1');
      expect(app.todos[0].status).toBe('not started');
      expect(app.todos[0].id).toBeDefined();
    });

    test('HAPPY PATH: should add todo with priority 2 (Medium)', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const priorityRadio = document.querySelector('input[name="priority"][value="2"]');
      nameInput.value = 'Medium Priority Task';
      priorityRadio.checked = true;
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].priority).toBe('2');
    });

    test('HAPPY PATH: should add todo with priority 3 (High)', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const priorityRadio = document.querySelector('input[name="priority"][value="3"]');
      nameInput.value = 'High Priority Task';
      priorityRadio.checked = true;
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].priority).toBe('3');
    });

    test('HAPPY PATH: should add todo with status "in progress"', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const statusSelect = document.getElementById('todoStatus');
      nameInput.value = 'In Progress Task';
      statusSelect.value = 'in progress';
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].status).toBe('in progress');
    });

    test('HAPPY PATH: should add todo with status "completed"', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const statusSelect = document.getElementById('todoStatus');
      nameInput.value = 'Completed Task';
      statusSelect.value = 'completed';
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].status).toBe('completed');
    });

    test('HAPPY PATH: should reset form after adding todo', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const statusSelect = document.getElementById('todoStatus');
      nameInput.value = 'Test Task';
      statusSelect.value = 'in progress';
      
      // Act
      app.addTodo();
      
      // Assert
      expect(nameInput.value).toBe('');
      expect(statusSelect.value).toBe('not started');
      const defaultPriority = document.querySelector('input[name="priority"][value="1"]');
      expect(defaultPriority.checked).toBe(true);
    });

    test('HAPPY PATH: should persist todo to localStorage', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      nameInput.value = 'Persistent Task';
      
      // Act
      app.addTodo();
      
      // Assert
      const savedData = localStorage.getItem('todos');
      expect(savedData).toBeDefined();
      const parsed = JSON.parse(savedData);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('Persistent Task');
    });

    test('FAILURE MODE: should not add todo with empty name', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      nameInput.value = '';
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(0);
      expect(global.alert).toHaveBeenCalledWith('Please enter a task name!');
    });

    test('FAILURE MODE: should not add todo with whitespace-only name', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      nameInput.value = '     ';
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(0);
      expect(global.alert).toHaveBeenCalledWith('Please enter a task name!');
    });

    test('FAILURE MODE: should reject name exceeding max length', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const longName = 'a'.repeat(201); // Exceeds maxNameLength of 200
      nameInput.value = longName;
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(0);
      expect(global.alert).toHaveBeenCalledWith('Task name is too long! Maximum 200 characters allowed.');
    });

    test('EDGE CASE: should accept name at exactly max length', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const maxLengthName = 'a'.repeat(200);
      nameInput.value = maxLengthName;
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos.length).toBe(1);
      expect(app.todos[0].name).toBe(maxLengthName);
    });

    test('EDGE CASE: should trim whitespace from task name', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      nameInput.value = '  Task with spaces  ';
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].name).toBe('Task with spaces');
    });

    test('EDGE CASE: should handle special characters in task name', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const specialName = 'Task with !@#$%^&*() special chars';
      nameInput.value = specialName;
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].name).toBe(specialName);
    });

    test('EDGE CASE: should handle unicode characters in task name', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const unicodeName = 'タスク 📝 émojis';
      nameInput.value = unicodeName;
      
      // Act
      app.addTodo();
      
      // Assert
      expect(app.todos[0].name).toBe(unicodeName);
    });

    test('FAILURE MODE: should throw error if name input element not found', () => {
      // Arrange
      document.getElementById('todoName').remove();
      
      // Act & Assert
      expect(() => app.addTodo()).toThrow('Name input element not found');
    });

    test('FAILURE MODE: should handle invalid status gracefully', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      const statusSelect = document.getElementById('todoStatus');
      nameInput.value = 'Test Task';
      statusSelect.value = 'invalid status';
      
      // Act
      const result = app.addTodo();
      
      // Assert
      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Invalid status selected!');
    });

    test('EDGE CASE: should add multiple todos sequentially', () => {
      // Arrange & Act
      const nameInput = document.getElementById('todoName');
      
      nameInput.value = 'Task 1';
      app.addTodo();
      
      nameInput.value = 'Task 2';
      app.addTodo();
      
      nameInput.value = 'Task 3';
      app.addTodo();
      
      // Assert
      expect(app.todos.length).toBe(3);
      expect(app.todos[0].name).toBe('Task 1');
      expect(app.todos[1].name).toBe('Task 2');
      expect(app.todos[2].name).toBe('Task 3');
    });

    test('EDGE CASE: should generate unique IDs for todos', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      
      // Act
      nameInput.value = 'Task 1';
      app.addTodo();
      
      nameInput.value = 'Task 2';
      app.addTodo();
      
      // Assert
      expect(app.todos[0].id).not.toBe(app.todos[1].id);
      expect(typeof app.todos[0].id).toBe('number');
      expect(typeof app.todos[1].id).toBe('number');
    });
  });

  // ============================================
  // DELETE TODO TESTS
  // ============================================
  describe('Deleting Todos', () => {
    
    beforeEach(() => {
      // Arrange: Add some test todos
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '2', status: 'in progress' },
        { id: 3, name: 'Task 3', priority: '3', status: 'completed' }
      ];
    });

    test('HAPPY PATH: should delete todo when confirmed', () => {
      // Arrange
      global.confirm.mockReturnValue(true);
      
      // Act
      const result = app.deleteTodo(1);
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos.length).toBe(2);
      expect(app.todos.find(t => t.id === 1)).toBeUndefined();
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this item?');
    });

    test('HAPPY PATH: should not delete todo when cancelled', () => {
      // Arrange
      global.confirm.mockReturnValue(false);
      const originalLength = app.todos.length;
      
      // Act
      const result = app.deleteTodo(1);
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(originalLength);
      expect(app.todos.find(t => t.id === 1)).toBeDefined();
    });

    test('HAPPY PATH: should persist deletion to localStorage', () => {
      // Arrange
      global.confirm.mockReturnValue(true);
      
      // Act
      app.deleteTodo(1);
      
      // Assert
      const savedData = localStorage.getItem('todos');
      const parsed = JSON.parse(savedData);
      expect(parsed.length).toBe(2);
      expect(parsed.find(t => t.id === 1)).toBeUndefined();
    });

    test('FAILURE MODE: should return false for non-existent todo', () => {
      // Arrange
      global.confirm.mockReturnValue(true);
      
      // Act
      const result = app.deleteTodo(999);
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(3);
    });

    test('FAILURE MODE: should throw error for null ID', () => {
      // Act & Assert
      expect(() => app.deleteTodo(null)).toThrow('Invalid todo ID');
    });

    test('FAILURE MODE: should throw error for undefined ID', () => {
      // Act & Assert
      expect(() => app.deleteTodo(undefined)).toThrow('Invalid todo ID');
    });

    test('FAILURE MODE: should throw error for non-number ID', () => {
      // Act & Assert
      expect(() => app.deleteTodo('not a number')).toThrow('Invalid todo ID');
    });

    test('EDGE CASE: should delete last remaining todo', () => {
      // Arrange
      app.todos = [{ id: 1, name: 'Last Task', priority: '1', status: 'not started' }];
      global.confirm.mockReturnValue(true);
      
      // Act
      app.deleteTodo(1);
      
      // Assert
      expect(app.todos.length).toBe(0);
    });

    test('EDGE CASE: should handle deletion from empty list', () => {
      // Arrange
      app.todos = [];
      global.confirm.mockReturnValue(true);
      
      // Act
      const result = app.deleteTodo(1);
      
      // Assert
      expect(result).toBe(false);
      expect(app.todos.length).toBe(0);
    });

    test('EDGE CASE: should delete correct todo among many', () => {
      // Arrange
      app.todos = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Task ${i + 1}`,
        priority: '1',
        status: 'not started'
      }));
      global.confirm.mockReturnValue(true);
      
      // Act
      app.deleteTodo(5);
      
      // Assert
      expect(app.todos.length).toBe(9);
      expect(app.todos.find(t => t.id === 5)).toBeUndefined();
      expect(app.todos.find(t => t.id === 4)).toBeDefined();
      expect(app.todos.find(t => t.id === 6)).toBeDefined();
    });
  });

  // ============================================
  // UPDATE TODO TESTS
  // ============================================
  describe('Updating Todos', () => {
    
    beforeEach(() => {
      // Arrange: Add test todo and render it
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' }
      ];
      app.currentEditingId = 1;
      app.render();
    });

    test('HAPPY PATH: should update todo priority', () => {
      // Arrange
      const priorityRadio = document.querySelector('input[name="edit-priority-1"][value="3"]');
      priorityRadio.checked = true;
      
      // Act
      const result = app.updateTodo(1);
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos[0].priority).toBe('3');
    });

    test('HAPPY PATH: should update todo status', () => {
      // Arrange
      const statusSelect = document.getElementById('edit-status-1');
      statusSelect.value = 'completed';
      
      // Act
      const result = app.updateTodo(1);
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos[0].status).toBe('completed');
    });

    test('HAPPY PATH: should update both priority and status', () => {
      // Arrange
      const priorityRadio = document.querySelector('input[name="edit-priority-1"][value="2"]');
      const statusSelect = document.getElementById('edit-status-1');
      priorityRadio.checked = true;
      statusSelect.value = 'in progress';
      
      // Act
      app.updateTodo(1);
      
      // Assert
      expect(app.todos[0].priority).toBe('2');
      expect(app.todos[0].status).toBe('in progress');
    });

    test('HAPPY PATH: should clear editing mode after update', () => {
      // Arrange
      const statusSelect = document.getElementById('edit-status-1');
      statusSelect.value = 'completed';
      
      // Act
      app.updateTodo(1);
      
      // Assert
      expect(app.currentEditingId).toBeNull();
    });

    test('HAPPY PATH: should persist update to localStorage', () => {
      // Arrange
      const statusSelect = document.getElementById('edit-status-1');
      statusSelect.value = 'completed';
      
      // Act
      app.updateTodo(1);
      
      // Assert
      const savedData = localStorage.getItem('todos');
      const parsed = JSON.parse(savedData);
      expect(parsed[0].status).toBe('completed');
    });

    test('FAILURE MODE: should return false for non-existent todo', () => {
      // Act
      const result = app.updateTodo(999);
      
      // Assert
      expect(result).toBe(false);
    });

    test('FAILURE MODE: should throw error for null ID', () => {
      // Act & Assert
      expect(() => app.updateTodo(null)).toThrow('Invalid todo ID');
    });

    test('FAILURE MODE: should throw error for undefined ID', () => {
      // Act & Assert
      expect(() => app.updateTodo(undefined)).toThrow('Invalid todo ID');
    });

    test('FAILURE MODE: should throw error for non-number ID', () => {
      // Act & Assert
      expect(() => app.updateTodo('string')).toThrow('Invalid todo ID');
    });

    test('FAILURE MODE: should reject invalid priority', () => {
      // Arrange
      const priorityRadio = document.querySelector('input[name="edit-priority-1"][value="1"]');
      priorityRadio.value = '999'; // Invalid priority
      priorityRadio.checked = true;
      
      // Act
      const result = app.updateTodo(1);
      
      // Assert
      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Invalid priority selected!');
    });

    test('FAILURE MODE: should reject invalid status', () => {
      // Arrange
      const statusSelect = document.getElementById('edit-status-1');
      statusSelect.value = 'invalid-status';
      
      // Act
      const result = app.updateTodo(1);
      
      // Assert
      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Invalid status selected!');
    });

    test('EDGE CASE: should handle update when status select not found', () => {
      // Arrange
      document.getElementById('edit-status-1').remove();
      
      // Act
      const result = app.updateTodo(1);
      
      // Assert
      expect(result).toBe(false);
    });
  });

  // ============================================
  // TOGGLE EDIT TESTS
  // ============================================
  describe('Toggle Edit Mode', () => {
    
    beforeEach(() => {
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '2', status: 'in progress' }
      ];
    });

    test('HAPPY PATH: should enable edit mode for todo', () => {
      // Arrange
      expect(app.currentEditingId).toBeNull();
      
      // Act
      app.toggleEdit(1);
      
      // Assert
      expect(app.currentEditingId).toBe(1);
    });

    test('HAPPY PATH: should disable edit mode when toggling same todo', () => {
      // Arrange
      app.currentEditingId = 1;
      
      // Act
      app.toggleEdit(1);
      
      // Assert
      expect(app.currentEditingId).toBeNull();
    });

    test('HAPPY PATH: should switch edit mode to different todo', () => {
      // Arrange
      app.currentEditingId = 1;
      
      // Act
      app.toggleEdit(2);
      
      // Assert
      expect(app.currentEditingId).toBe(2);
    });

    test('EDGE CASE: should handle toggle on non-existent todo', () => {
      // Act
      app.toggleEdit(999);
      
      // Assert
      expect(app.currentEditingId).toBe(999);
    });
  });

  // ============================================
  // HELPER FUNCTION TESTS
  // ============================================
  describe('Helper Functions', () => {
    
    describe('getPriorityLabel', () => {
      test('HAPPY PATH: should return correct label for priority 1', () => {
        expect(app.getPriorityLabel('1')).toBe('Low');
      });

      test('HAPPY PATH: should return correct label for priority 2', () => {
        expect(app.getPriorityLabel('2')).toBe('Medium');
      });

      test('HAPPY PATH: should return correct label for priority 3', () => {
        expect(app.getPriorityLabel('3')).toBe('High');
      });

      test('EDGE CASE: should return default for invalid priority', () => {
        expect(app.getPriorityLabel('999')).toBe('Low');
      });

      test('EDGE CASE: should return default for undefined', () => {
        expect(app.getPriorityLabel(undefined)).toBe('Low');
      });
    });

    describe('getStatusClass', () => {
      test('HAPPY PATH: should convert "not started" to "not-started"', () => {
        expect(app.getStatusClass('not started')).toBe('not-started');
      });

      test('HAPPY PATH: should convert "in progress" to "in-progress"', () => {
        expect(app.getStatusClass('in progress')).toBe('in-progress');
      });

      test('HAPPY PATH: should keep single word status unchanged', () => {
        expect(app.getStatusClass('completed')).toBe('completed');
      });

      test('EDGE CASE: should handle multiple spaces', () => {
        expect(app.getStatusClass('multiple   spaces')).toBe('multiple-spaces');
      });
    });

    describe('escapeHtml', () => {
      test('HAPPY PATH: should escape HTML tags', () => {
        const result = app.escapeHtml('<script>alert("xss")</script>');
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      });

      test('HAPPY PATH: should escape ampersands', () => {
        expect(app.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      });

      test('HAPPY PATH: should escape quotes', () => {
        expect(app.escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
      });

      test('HAPPY PATH: should escape single quotes', () => {
        expect(app.escapeHtml("It's working")).toBe('It&#039;s working');
      });

      test('EDGE CASE: should handle null input', () => {
        expect(app.escapeHtml(null)).toBe('');
      });

      test('EDGE CASE: should handle undefined input', () => {
        expect(app.escapeHtml(undefined)).toBe('');
      });

      test('EDGE CASE: should handle numbers', () => {
        expect(app.escapeHtml(123)).toBe('123');
      });

      test('EDGE CASE: should handle empty string', () => {
        expect(app.escapeHtml('')).toBe('');
      });

      test('EDGE CASE: should not double-escape', () => {
        const once = app.escapeHtml('<div>');
        const twice = app.escapeHtml(once);
        expect(twice).toBe('&amp;lt;div&amp;gt;');
      });
    });

    describe('capitalizeFirst', () => {
      test('HAPPY PATH: should capitalize first letter', () => {
        expect(app.capitalizeFirst('hello')).toBe('Hello');
      });

      test('HAPPY PATH: should not change already capitalized string', () => {
        expect(app.capitalizeFirst('WORLD')).toBe('WORLD');
      });

      test('EDGE CASE: should handle single character', () => {
        expect(app.capitalizeFirst('a')).toBe('A');
      });

      test('EDGE CASE: should handle empty string', () => {
        expect(app.capitalizeFirst('')).toBe('');
      });

      test('EDGE CASE: should handle null', () => {
        expect(app.capitalizeFirst(null)).toBe('');
      });

      test('EDGE CASE: should handle undefined', () => {
        expect(app.capitalizeFirst(undefined)).toBe('');
      });

      test('EDGE CASE: should handle non-string input', () => {
        expect(app.capitalizeFirst(123)).toBe('');
      });
    });
  });

  // ============================================
  // RENDER TESTS
  // ============================================
  describe('Rendering', () => {
    
    test('HAPPY PATH: should display empty state when no todos', () => {
      // Arrange
      app.todos = [];
      
      // Act
      app.render();
      
      // Assert
      const todoList = document.getElementById('todoList');
      expect(todoList.innerHTML).toContain('No TO-DO items yet');
    });

    test('HAPPY PATH: should render single todo', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Test Task', priority: '2', status: 'not started' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItems = document.querySelectorAll('.todo-item');
      expect(todoItems.length).toBe(1);
      expect(document.querySelector('.todo-name').textContent).toBe('Test Task');
    });

    test('HAPPY PATH: should render multiple todos', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '2', status: 'in progress' },
        { id: 3, name: 'Task 3', priority: '3', status: 'completed' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItems = document.querySelectorAll('.todo-item');
      expect(todoItems.length).toBe(3);
    });

    test('HAPPY PATH: should show edit controls when editing', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' }
      ];
      app.currentEditingId = 1;
      
      // Act
      app.render();
      
      // Assert
      const editControls = document.querySelector('.edit-controls.visible');
      expect(editControls).toBeTruthy();
    });

    test('HAPPY PATH: should not show edit controls when not editing', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' }
      ];
      app.currentEditingId = null;
      
      // Act
      app.render();
      
      // Assert
      const editControls = document.querySelector('.edit-controls.visible');
      expect(editControls).toBeFalsy();
    });

    test('EDGE CASE: should handle render when todoList element not found', () => {
      // Arrange
      document.getElementById('todoList').remove();
      
      // Act & Assert - should not throw
      expect(() => app.render()).not.toThrow();
    });

    test('EDGE CASE: should escape HTML in todo names', () => {
      // Arrange
      app.todos = [
        { id: 1, name: '<script>alert("xss")</script>', priority: '1', status: 'not started' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoName = document.querySelector('.todo-name');
      expect(todoName.textContent).toBe('<script>alert("xss")</script>');
      expect(todoName.innerHTML).not.toContain('<script>');
    });

    test('HAPPY PATH: should highlight "not started" todos in red', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Not Started Task', priority: '1', status: 'not started' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-not-started')).toBe(true);
    });

    test('HAPPY PATH: should highlight "in progress" todos in orange', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'In Progress Task', priority: '1', status: 'in progress' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-in-progress')).toBe(true);
    });

    test('HAPPY PATH: should highlight "completed" todos in green', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Completed Task', priority: '1', status: 'completed' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-completed')).toBe(true);
    });

    test('HAPPY PATH: should apply correct highlight to multiple todos with different statuses', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '2', status: 'in progress' },
        { id: 3, name: 'Task 3', priority: '3', status: 'completed' }
      ];
      
      // Act
      app.render();
      
      // Assert
      const todoItems = document.querySelectorAll('.todo-item');
      expect(todoItems[0].classList.contains('status-highlight-not-started')).toBe(true);
      expect(todoItems[1].classList.contains('status-highlight-in-progress')).toBe(true);
      expect(todoItems[2].classList.contains('status-highlight-completed')).toBe(true);
    });

    test('HAPPY PATH: should update highlight color when status changes', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' }
      ];
      app.currentEditingId = 1;
      app.render();
      
      // Verify initial red highlight
      let todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-not-started')).toBe(true);
      
      // Act - Change status to in progress
      const statusSelect = document.getElementById('edit-status-1');
      statusSelect.value = 'in progress';
      app.updateTodo(1);
      
      // Assert - Should now have orange highlight
      todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-in-progress')).toBe(true);
      expect(todoItem.classList.contains('status-highlight-not-started')).toBe(false);
    });

    test('EDGE CASE: should maintain highlight when todo is in edit mode', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'in progress' }
      ];
      app.currentEditingId = 1;
      
      // Act
      app.render();
      
      // Assert
      const todoItem = document.querySelector('.todo-item');
      expect(todoItem.classList.contains('status-highlight-in-progress')).toBe(true);
      expect(todoItem.classList.contains('editing')).toBe(true);
    });
  });

  // ============================================
  // LOCALSTORAGE TESTS
  // ============================================
  describe('LocalStorage Operations', () => {
    
    test('HAPPY PATH: should save todos to localStorage', () => {
      // Arrange
      app.todos = [
        { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
        { id: 2, name: 'Task 2', priority: '2', status: 'in progress' }
      ];
      
      // Act
      const result = app.saveTodos();
      
      // Assert
      expect(result).toBe(true);
      const savedData = localStorage.getItem('todos');
      expect(savedData).toBeDefined();
      expect(JSON.parse(savedData)).toEqual(app.todos);
    });

    test('HAPPY PATH: should load todos from localStorage', () => {
      // Arrange
      const mockTodos = [
        { id: 1, name: 'Loaded Task', priority: '2', status: 'in progress' }
      ];
      localStorage.setItem('todos', JSON.stringify(mockTodos));
      
      // Act
      const result = app.loadTodos();
      
      // Assert
      expect(result).toBe(true);
      expect(app.todos).toEqual(mockTodos);
    });

    test('FAILURE MODE: should handle localStorage save error', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      app.todos = [{ id: 1, name: 'Task', priority: '1', status: 'not started' }];
      
      // Act
      const result = app.saveTodos();
      
      // Assert
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      Storage.prototype.setItem.mockRestore();
    });

    test('EDGE CASE: should save empty array', () => {
      // Arrange
      app.todos = [];
      
      // Act
      app.saveTodos();
      
      // Assert
      const savedData = localStorage.getItem('todos');
      expect(JSON.parse(savedData)).toEqual([]);
    });
  });

  // ============================================
  // UTILITY METHOD TESTS
  // ============================================
  describe('Utility Methods', () => {
    
    describe('getTodoById', () => {
      beforeEach(() => {
        app.todos = [
          { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
          { id: 2, name: 'Task 2', priority: '2', status: 'in progress' }
        ];
      });

      test('HAPPY PATH: should return todo by ID', () => {
        // Act
        const result = app.getTodoById(1);
        
        // Assert
        expect(result).toEqual(app.todos[0]);
      });

      test('EDGE CASE: should return null for non-existent ID', () => {
        // Act
        const result = app.getTodoById(999);
        
        // Assert
        expect(result).toBeNull();
      });
    });

    describe('getTodoCount', () => {
      test('HAPPY PATH: should return correct count', () => {
        // Arrange
        app.todos = [
          { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
          { id: 2, name: 'Task 2', priority: '2', status: 'in progress' }
        ];
        
        // Act & Assert
        expect(app.getTodoCount()).toBe(2);
      });

      test('EDGE CASE: should return 0 for empty list', () => {
        // Arrange
        app.todos = [];
        
        // Act & Assert
        expect(app.getTodoCount()).toBe(0);
      });
    });

    describe('getTodosByStatus', () => {
      beforeEach(() => {
        app.todos = [
          { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
          { id: 2, name: 'Task 2', priority: '2', status: 'in progress' },
          { id: 3, name: 'Task 3', priority: '3', status: 'completed' },
          { id: 4, name: 'Task 4', priority: '1', status: 'not started' }
        ];
      });

      test('HAPPY PATH: should return todos with "not started" status', () => {
        // Act
        const result = app.getTodosByStatus('not started');
        
        // Assert
        expect(result.length).toBe(2);
        expect(result.every(t => t.status === 'not started')).toBe(true);
      });

      test('HAPPY PATH: should return todos with "in progress" status', () => {
        // Act
        const result = app.getTodosByStatus('in progress');
        
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].status).toBe('in progress');
      });

      test('HAPPY PATH: should return todos with "completed" status', () => {
        // Act
        const result = app.getTodosByStatus('completed');
        
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].status).toBe('completed');
      });

      test('EDGE CASE: should return empty array for invalid status', () => {
        // Act
        const result = app.getTodosByStatus('invalid');
        
        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('getTodosByPriority', () => {
      beforeEach(() => {
        app.todos = [
          { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
          { id: 2, name: 'Task 2', priority: '2', status: 'in progress' },
          { id: 3, name: 'Task 3', priority: '3', status: 'completed' },
          { id: 4, name: 'Task 4', priority: '1', status: 'not started' }
        ];
      });

      test('HAPPY PATH: should return todos with priority 1', () => {
        // Act
        const result = app.getTodosByPriority('1');
        
        // Assert
        expect(result.length).toBe(2);
        expect(result.every(t => t.priority === '1')).toBe(true);
      });

      test('HAPPY PATH: should return todos with priority 2', () => {
        // Act
        const result = app.getTodosByPriority('2');
        
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].priority).toBe('2');
      });

      test('HAPPY PATH: should return todos with priority 3', () => {
        // Act
        const result = app.getTodosByPriority('3');
        
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].priority).toBe('3');
      });

      test('EDGE CASE: should return empty array for invalid priority', () => {
        // Act
        const result = app.getTodosByPriority('999');
        
        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('clearAllTodos', () => {
      beforeEach(() => {
        app.todos = [
          { id: 1, name: 'Task 1', priority: '1', status: 'not started' },
          { id: 2, name: 'Task 2', priority: '2', status: 'in progress' }
        ];
        app.currentEditingId = 1;
      });

      test('HAPPY PATH: should clear all todos when confirmed', () => {
        // Arrange
        global.confirm.mockReturnValue(true);
        
        // Act
        const result = app.clearAllTodos();
        
        // Assert
        expect(result).toBe(true);
        expect(app.todos).toEqual([]);
        expect(app.currentEditingId).toBeNull();
      });

      test('HAPPY PATH: should not clear todos when cancelled', () => {
        // Arrange
        global.confirm.mockReturnValue(false);
        const originalTodos = [...app.todos];
        
        // Act
        const result = app.clearAllTodos();
        
        // Assert
        expect(result).toBe(false);
        expect(app.todos).toEqual(originalTodos);
      });

      test('HAPPY PATH: should persist clear to localStorage', () => {
        // Arrange
        global.confirm.mockReturnValue(true);
        
        // Act
        app.clearAllTodos();
        
        // Assert
        const savedData = localStorage.getItem('todos');
        expect(JSON.parse(savedData)).toEqual([]);
      });
    });

    describe('resetForm', () => {
      test('HAPPY PATH: should reset all form fields', () => {
        // Arrange
        const nameInput = document.getElementById('todoName');
        const statusSelect = document.getElementById('todoStatus');
        const priority2Radio = document.querySelector('input[name="priority"][value="2"]');
        
        nameInput.value = 'Some Task';
        statusSelect.value = 'completed';
        priority2Radio.checked = true;
        
        // Act
        app.resetForm();
        
        // Assert
        expect(nameInput.value).toBe('');
        expect(statusSelect.value).toBe('not started');
        const priority1Radio = document.querySelector('input[name="priority"][value="1"]');
        expect(priority1Radio.checked).toBe(true);
      });

      test('EDGE CASE: should handle missing form elements gracefully', () => {
        // Arrange
        document.getElementById('todoName').remove();
        
        // Act & Assert - should not throw
        expect(() => app.resetForm()).not.toThrow();
      });
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe('Integration Tests', () => {
    
    test('COMPLETE WORKFLOW: add, edit, and delete todo', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      nameInput.value = 'Integration Test Task';
      
      // Act 1: Add todo
      app.addTodo();
      expect(app.todos.length).toBe(1);
      const todoId = app.todos[0].id;
      
      // Act 2: Edit todo
      app.currentEditingId = todoId;
      app.render();
      const statusSelect = document.getElementById(`edit-status-${todoId}`);
      statusSelect.value = 'completed';
      app.updateTodo(todoId);
      expect(app.todos[0].status).toBe('completed');
      
      // Act 3: Delete todo
      global.confirm.mockReturnValue(true);
      app.deleteTodo(todoId);
      
      // Assert
      expect(app.todos.length).toBe(0);
    });

    test('PERSISTENCE: todos should persist across app instances', () => {
      // Arrange & Act 1: Create and save todo
      const nameInput = document.getElementById('todoName');
      nameInput.value = 'Persistent Task';
      app.addTodo();
      
      // Act 2: Create new app instance
      const newApp = new TodoApp(false);
      newApp.loadTodos();
      
      // Assert
      expect(newApp.todos.length).toBe(1);
      expect(newApp.todos[0].name).toBe('Persistent Task');
    });

    test('BULK OPERATIONS: add and delete multiple todos', () => {
      // Arrange
      const nameInput = document.getElementById('todoName');
      global.confirm.mockReturnValue(true);
      
      // Act: Add 5 todos
      for (let i = 1; i <= 5; i++) {
        nameInput.value = `Task ${i}`;
        app.addTodo();
      }
      expect(app.todos.length).toBe(5);
      
      // Act: Delete 3 todos
      const idsToDelete = [app.todos[0].id, app.todos[2].id, app.todos[4].id];
      idsToDelete.forEach(id => app.deleteTodo(id));
      
      // Assert
      expect(app.todos.length).toBe(2);
    });
  });
});
