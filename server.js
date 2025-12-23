const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_FILE = path.join(__dirname, 'tasks.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (index.html, etc.)

// Initialize storage
let tasks = [];
let nextId = 1;

// Load tasks from file on startup
async function loadTasks() {
    try {
        const data = await fs.readFile(STORAGE_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        tasks = parsedData.tasks || [];
        nextId = parsedData.nextId || 1;
        console.log(`Loaded ${tasks.length} tasks from storage`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('No existing storage file, starting fresh');
            tasks = [];
            nextId = 1;
        } else {
            console.error('Error loading tasks:', error.message);
        }
    }
}

// Save tasks to file
async function saveTasks() {
    try {
        const data = JSON.stringify({ tasks, nextId }, null, 2);
        await fs.writeFile(STORAGE_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error saving tasks:', error.message);
        throw error;
    }
}

// Validation helpers
function validateTask(task) {
    const errors = [];
    
    if (task.name === null || task.name === undefined || typeof task.name !== 'string') {
        errors.push('Task name is required and must be a string');
    } else if (task.name.trim().length === 0) {
        errors.push('Task name cannot be empty or whitespace only');
    } else if (task.name.length > 200) {
        errors.push('Task name cannot exceed 200 characters');
    }
    
    const validPriorities = ['1', '2', '3'];
    if (task.priority && !validPriorities.includes(String(task.priority))) {
        errors.push('Priority must be 1, 2, or 3');
    }
    
    const validStatuses = ['not started', 'in progress', 'completed'];
    if (task.status && !validStatuses.includes(task.status)) {
        errors.push('Status must be "not started", "in progress", or "completed"');
    }
    
    return errors;
}

// Routes

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
    try {
        // Return simplified task data (name and status) as requested
        const simplifiedTasks = tasks.map(task => ({
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority
        }));
        res.json({ success: true, data: simplifiedTasks, count: tasks.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve tasks' });
    }
});

// GET /api/tasks/:id - Get a specific task
app.get('/api/tasks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid task ID' });
        }
        
        const task = tasks.find(t => t.id === id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        res.json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve task' });
    }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { name, priority = '1', status = 'not started' } = req.body;
        
        // Validate input
        const errors = validateTask({ name, priority, status });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        
        // Create new task
        const newTask = {
            id: nextId++,
            name: name.trim(),
            priority: String(priority),
            status: status.toLowerCase()
        };
        
        tasks.push(newTask);
        await saveTasks();
        
        res.status(201).json({ success: true, data: newTask, message: 'Task created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id - Update an existing task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid task ID' });
        }
        
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        const { name, priority, status } = req.body;
        const updateData = {};
        
        // Only update provided fields
        if (name !== undefined) {
            updateData.name = name;
        }
        if (priority !== undefined) {
            updateData.priority = priority;
        }
        if (status !== undefined) {
            updateData.status = status;
        }
        
        // Validate updates
        const taskToValidate = { ...tasks[taskIndex], ...updateData };
        const errors = validateTask(taskToValidate);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        
        // Apply updates
        if (name !== undefined) tasks[taskIndex].name = name.trim();
        if (priority !== undefined) tasks[taskIndex].priority = String(priority);
        if (status !== undefined) tasks[taskIndex].status = status.toLowerCase();
        
        await saveTasks();
        
        res.json({ success: true, data: tasks[taskIndex], message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid task ID' });
        }
        
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        const deletedTask = tasks[taskIndex];
        tasks.splice(taskIndex, 1);
        await saveTasks();
        
        res.json({ success: true, data: deletedTask, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
});

// Start server
async function startServer() {
    await loadTasks();
    
    // Only start listening if not in test mode
    if (process.env.NODE_ENV !== 'test') {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`API endpoints available at http://localhost:${PORT}/api/tasks`);
        });
    }
}

// Reset function for testing
function resetStorage() {
    tasks = [];
    nextId = 1;
}

startServer();

// Export for testing
module.exports = { app, loadTasks, saveTasks, resetStorage };
