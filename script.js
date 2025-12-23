// TO-DO List Application
class TodoApp {
    constructor(autoInit = true) {
        this.todos = [];
        this.currentEditingId = null;
        this.maxNameLength = 200;
        this.validPriorities = ['1', '2', '3'];
        this.validStatuses = ['not started', 'in progress', 'completed'];
        this.apiBaseUrl = '/api/tasks'; // API endpoint
        this.useApi = true; // Try to use API by default
        
        if (autoInit) {
            this.init();
        }
    }

    async init() {
        // Try to detect if API is available
        await this.detectApiAvailability();
        
        // Load todos from API or localStorage
        await this.loadTodos();
        
        // Event listeners
        const addBtn = document.getElementById('addTodoBtn');
        const nameInput = document.getElementById('todoName');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addTodo());
        }
        
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTodo();
                }
            });
        }
        
        // Render initial list
        this.render();
    }

    async detectApiAvailability() {
        try {
            const response = await fetch(this.apiBaseUrl, { method: 'GET' });
            this.useApi = response.ok;
            console.log(this.useApi ? '✅ Using API backend' : '⚠️ API unavailable, using localStorage');
        } catch (error) {
            this.useApi = false;
            console.log('⚠️ API unavailable, using localStorage');
        }
    }

    async addTodo() {
        const nameInput = document.getElementById('todoName');
        if (!nameInput) {
            throw new Error('Name input element not found');
        }
        
        const name = nameInput.value.trim();
        
        // Validation
        if (!name) {
            alert('Please enter a task name!');
            return false;
        }
        
        if (name.length > this.maxNameLength) {
            alert(`Task name is too long! Maximum ${this.maxNameLength} characters allowed.`);
            return false;
        }

        const priorityRadios = document.querySelectorAll('input[name="priority"]');
        let priority = '1';
        priorityRadios.forEach(radio => {
            if (radio.checked) {
                priority = radio.value;
            }
        });
        
        // Validate priority
        if (!this.validPriorities.includes(priority)) {
            priority = '1'; // Default to low priority
        }

        const statusSelect = document.getElementById('todoStatus');
        const status = statusSelect ? statusSelect.value : 'not started';
        
        // Validate status
        if (!this.validStatuses.includes(status)) {
            alert('Invalid status selected!');
            return false;
        }

        const newTodo = {
            id: Date.now(),
            name: name,
            priority: priority,
            status: status
        };

        if (this.useApi) {
            try {
                const response = await fetch(this.apiBaseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, priority, status })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    await this.loadTodos(); // Reload from API
                } else {
                    alert('Failed to add task via API');
                    return false;
                }
            } catch (error) {
                console.error('API error:', error);
                alert('Failed to add task. Using localStorage fallback.');
                this.useApi = false;
                this.todos.push(newTodo);
                this.saveTodos();
            }
        } else {
            this.todos.push(newTodo);
            this.saveTodos();
        }
        
        this.render();

        // Reset form
        this.resetForm();
        
        return true;
    }
    
    resetForm() {
        const nameInput = document.getElementById('todoName');
        const statusSelect = document.getElementById('todoStatus');
        const defaultPriority = document.querySelector('input[name="priority"][value="1"]');
        
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
        }
        
        if (defaultPriority) {
            defaultPriority.checked = true;
        }
        
        if (statusSelect) {
            statusSelect.value = 'not started';
        }
    }

    async deleteTodo(id) {
        // Validate id
        if (id === null || id === undefined || typeof id !== 'number') {
            throw new Error('Invalid todo ID');
        }
        
        const todoExists = this.todos.some(todo => todo.id === id);
        if (!todoExists) {
            return false;
        }
        
        if (confirm('Are you sure you want to delete this item?')) {
            if (this.useApi) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        await this.loadTodos();
                        this.render();
                        return true;
                    } else {
                        alert('Failed to delete task via API');
                        return false;
                    }
                } catch (error) {
                    console.error('API error:', error);
                    this.useApi = false;
                    this.todos = this.todos.filter(todo => todo.id !== id);
                    this.saveTodos();
                    this.render();
                    return true;
                }
            } else {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveTodos();
                this.render();
                return true;
            }
        }
        
        return false;
    }

    toggleEdit(id) {
        // If clicking the same item, toggle off
        if (this.currentEditingId === id) {
            this.currentEditingId = null;
        } else {
            this.currentEditingId = id;
        }
        this.render();
    }

    updateTodo(id) {
        // Validate id
        if (id === null || id === undefined || typeof id !== 'number') {
            throw new Error('Invalid todo ID');
        }
        
        const todo = this.todos.find(t => t.id === id);
        if (!todo) {
            return false;
        }

        const priorityRadios = document.querySelectorAll(`input[name="edit-priority-${id}"]`);
        let newPriority = todo.priority;
        
        priorityRadios.forEach(radio => {
            if (radio.checked) {
                newPriority = radio.value;
            }
        });
        
        // Validate priority
        if (!this.validPriorities.includes(newPriority)) {
            alert('Invalid priority selected!');
            return false;
        }

        const statusSelect = document.getElementById(`edit-status-${id}`);
        if (!statusSelect) {
            return false;
        }
        
        const newStatus = statusSelect.value;
        
        // Validate status
        if (!this.validStatuses.includes(newStatus)) {
            alert('Invalid status selected!');
            return false;
        }
        
        todo.priority = newPriority;
        todo.status = newStatus;

        if (this.useApi) {
            // Update via API
            fetch(`${this.apiBaseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority, status: newStatus })
            })
            .then(response => {
                if (response.ok) {
                    return this.loadTodos();
                } else {
                    alert('Failed to update task via API');
                    this.useApi = false;
                    this.saveTodos();
                }
            })
            .then(() => {
                this.currentEditingId = null;
                this.render();
            })
            .catch(error => {
                console.error('API error:', error);
                this.useApi = false;
                this.saveTodos();
                this.currentEditingId = null;
                this.render();
            });
        } else {
            this.saveTodos();
            this.currentEditingId = null;
            this.render();
        }
        
        return true;
    }

    getPriorityLabel(priority) {
        const labels = {
            '1': 'Low',
            '2': 'Medium',
            '3': 'High'
        };
        return labels[priority] || 'Low';
    }

    getStatusClass(status) {
        return status.replace(/\s+/g, '-');
    }

    render() {
        const todoList = document.getElementById('todoList');
        
        if (!todoList) {
            return;
        }
        
        if (this.todos.length === 0) {
            todoList.innerHTML = '<div class="empty-state">No TO-DO items yet. Add one above!</div>';
            return;
        }

        todoList.innerHTML = this.todos.map(todo => {
            const isEditing = this.currentEditingId === todo.id;
            const statusClass = this.getStatusClass(todo.status);
            const highlightClass = `status-highlight-${statusClass}`;
            
            return `
                <div class="todo-item ${isEditing ? 'editing' : ''} ${highlightClass}" data-id="${todo.id}">
                    <div class="todo-header">
                        <div class="todo-name">${this.escapeHtml(todo.name)}</div>
                        <button class="btn btn-delete" onclick="app.deleteTodo(${todo.id}); event.stopPropagation();">Delete</button>
                    </div>
                    
                    <div class="todo-info">
                        <div class="todo-priority">
                            <strong>Priority:</strong>
                            <span class="priority-badge priority-${todo.priority}">
                                ${todo.priority} (${this.getPriorityLabel(todo.priority)})
                            </span>
                        </div>
                        <div class="todo-status">
                            <strong>Status:</strong>
                            <span class="status-badge status-${this.getStatusClass(todo.status)}">
                                ${this.capitalizeFirst(todo.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="edit-controls ${isEditing ? 'visible' : ''}">
                        <div class="edit-form-group">
                            <label>Change Priority:</label>
                            <div class="edit-radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="edit-priority-${todo.id}" value="1" ${todo.priority === '1' ? 'checked' : ''} />
                                    <span>1 (Low)</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="edit-priority-${todo.id}" value="2" ${todo.priority === '2' ? 'checked' : ''} />
                                    <span>2 (Medium)</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="edit-priority-${todo.id}" value="3" ${todo.priority === '3' ? 'checked' : ''} />
                                    <span>3 (High)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="edit-form-group">
                            <label for="edit-status-${todo.id}">Change Status:</label>
                            <select id="edit-status-${todo.id}">
                                <option value="not started" ${todo.status === 'not started' ? 'selected' : ''}>Not Started</option>
                                <option value="in progress" ${todo.status === 'in progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${todo.status === 'completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                        
                        <div class="edit-actions">
                            <button class="btn btn-primary" onclick="app.updateTodo(${todo.id}); event.stopPropagation();">Save Changes</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click event to toggle edit mode
        document.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't toggle if clicking on buttons or inputs
                if (e.target.tagName === 'BUTTON' || 
                    e.target.tagName === 'INPUT' || 
                    e.target.tagName === 'SELECT') {
                    return;
                }
                const id = parseInt(item.dataset.id);
                this.toggleEdit(id);
            });
        });
    }

    saveTodos() {
        // Only save to localStorage if not using API
        if (!this.useApi) {
            try {
                localStorage.setItem('todos', JSON.stringify(this.todos));
                return true;
            } catch (error) {
                console.error('Failed to save todos:', error);
                return false;
            }
        }
        return true;
    }

    async loadTodos() {
        if (this.useApi) {
            try {
                const response = await fetch(this.apiBaseUrl);
                if (response.ok) {
                    const result = await response.json();
                    this.todos = result.data || [];
                    console.log(`Loaded ${this.todos.length} todos from API`);
                    return true;
                } else {
                    console.warn('API failed, falling back to localStorage');
                    this.useApi = false;
                }
            } catch (error) {
                console.error('Failed to load from API:', error);
                this.useApi = false;
            }
        }
        
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem('todos');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.todos = parsed;
                    console.log(`Loaded ${this.todos.length} todos from localStorage`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
            return false;
        }
    }

    escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }
        
        const str = String(text);
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }

    capitalizeFirst(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    async clearAllTodos() {
        if (confirm('Are you sure you want to delete all todos?')) {
            if (this.useApi) {
                // Delete all todos via API
                const deletePromises = this.todos.map(todo => 
                    fetch(`${this.apiBaseUrl}/${todo.id}`, { method: 'DELETE' })
                );
                await Promise.all(deletePromises);
                await this.loadTodos();
            } else {
                this.todos = [];
                this.saveTodos();
            }
            
            this.currentEditingId = null;
            this.render();
            return true;
        }
        return false;
    }
    
    getTodoById(id) {
        return this.todos.find(todo => todo.id === id) || null;
    }
    
    getTodoCount() {
        return this.todos.length;
    }
    
    getTodosByStatus(status) {
        if (!this.validStatuses.includes(status)) {
            return [];
        }
        return this.todos.filter(todo => todo.status === status);
    }
    
    getTodosByPriority(priority) {
        if (!this.validPriorities.includes(priority)) {
            return [];
        }
        return this.todos.filter(todo => todo.priority === priority);
    }
}

// Initialize the app only if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const app = new TodoApp();
    // Make it globally accessible for inline event handlers
    window.app = app;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
}
