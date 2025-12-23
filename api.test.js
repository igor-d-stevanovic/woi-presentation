const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

const { app, resetStorage } = require('./server');

const TEST_STORAGE_FILE = path.join(__dirname, 'tasks.json');

// Helper to clean up storage between tests
async function cleanupStorage() {
    try {
        await fs.unlink(TEST_STORAGE_FILE);
    } catch (error) {
        // File doesn't exist, that's okay
    }
    resetStorage(); // Also reset in-memory storage
}

describe('Todo API - Comprehensive Test Suite', () => {
    
    // Clean up before and after all tests
    beforeAll(async () => {
        await cleanupStorage();
    });
    
    afterAll(async () => {
        await cleanupStorage();
    });

    describe('GET /api/tasks', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('HAPPY PATH: should return empty array when no tasks exist', async () => {
            // Arrange & Act
            const response = await request(app).get('/api/tasks');
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
            expect(response.body.count).toBe(0);
        });

        test('HAPPY PATH: should return all tasks with name and status', async () => {
            // Arrange - Create some tasks first
            await request(app)
                .post('/api/tasks')
                .send({ name: 'Task 1', status: 'not started', priority: '1' });
            await request(app)
                .post('/api/tasks')
                .send({ name: 'Task 2', status: 'in progress', priority: '2' });
            
            // Act
            const response = await request(app).get('/api/tasks');
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.count).toBe(2);
            expect(response.body.data[0]).toMatchObject({
                name: 'Task 1',
                status: 'not started',
                priority: '1'
            });
            expect(response.body.data[1]).toMatchObject({
                name: 'Task 2',
                status: 'in progress',
                priority: '2'
            });
        });

        test('EDGE CASE: should handle multiple tasks with same name', async () => {
            // Arrange
            await request(app).post('/api/tasks').send({ name: 'Duplicate', status: 'not started' });
            await request(app).post('/api/tasks').send({ name: 'Duplicate', status: 'completed' });
            
            // Act
            const response = await request(app).get('/api/tasks');
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].id).not.toBe(response.body.data[1].id);
        });
    });

    describe('GET /api/tasks/:id', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('HAPPY PATH: should return specific task by ID', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Test Task', status: 'not started', priority: '2' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app).get(`/api/tasks/${taskId}`);
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                id: taskId,
                name: 'Test Task',
                status: 'not started',
                priority: '2'
            });
        });

        test('FAILURE MODE: should return 404 for non-existent task', async () => {
            // Act
            const response = await request(app).get('/api/tasks/9999');
            
            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Task not found');
        });

        test('FAILURE MODE: should return 400 for invalid task ID', async () => {
            // Act
            const response = await request(app).get('/api/tasks/invalid');
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid task ID');
        });
    });

    describe('POST /api/tasks', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('HAPPY PATH: should create a new task with valid data', async () => {
            // Arrange
            const taskData = {
                name: 'New Task',
                status: 'not started',
                priority: '1'
            };
            
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send(taskData);
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                name: 'New Task',
                status: 'not started',
                priority: '1'
            });
            expect(response.body.data.id).toBeDefined();
            expect(response.body.message).toBe('Task created successfully');
        });

        test('HAPPY PATH: should create task with default values when optional fields omitted', async () => {
            // Arrange
            const taskData = { name: 'Minimal Task' };
            
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send(taskData);
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data).toMatchObject({
                name: 'Minimal Task',
                status: 'not started',
                priority: '1'
            });
        });

        test('HAPPY PATH: should create task with status "in progress"', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: 'Active Task', status: 'in progress', priority: '2' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.status).toBe('in progress');
        });

        test('HAPPY PATH: should create task with status "completed"', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: 'Done Task', status: 'completed', priority: '3' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.status).toBe('completed');
        });

        test('HAPPY PATH: should trim whitespace from task name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: '  Trimmed Task  ', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe('Trimmed Task');
        });

        test('HAPPY PATH: should persist task to storage', async () => {
            // Arrange & Act
            await request(app)
                .post('/api/tasks')
                .send({ name: 'Persistent Task', status: 'not started' });
            
            // Assert - Check storage file exists and contains task
            const fileData = await fs.readFile(TEST_STORAGE_FILE, 'utf8');
            const parsedData = JSON.parse(fileData);
            expect(parsedData.tasks).toHaveLength(1);
            expect(parsedData.tasks[0].name).toBe('Persistent Task');
        });

        test('FAILURE MODE: should reject task with empty name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: '', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Task name cannot be empty or whitespace only');
        });

        test('FAILURE MODE: should reject task with whitespace-only name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: '   ', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Task name cannot be empty or whitespace only');
        });

        test('FAILURE MODE: should reject task without name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ status: 'not started' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        test('FAILURE MODE: should reject task with name exceeding max length', async () => {
            // Arrange
            const longName = 'a'.repeat(201);
            
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: longName, status: 'not started' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Task name cannot exceed 200 characters');
        });

        test('EDGE CASE: should accept task name at exactly max length (200 chars)', async () => {
            // Arrange
            const maxLengthName = 'a'.repeat(200);
            
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: maxLengthName, status: 'not started' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe(maxLengthName);
        });

        test('FAILURE MODE: should reject invalid priority', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', priority: '5', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Priority must be 1, 2, or 3');
        });

        test('FAILURE MODE: should reject invalid status', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'invalid status' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Status must be "not started", "in progress", or "completed"');
        });

        test('EDGE CASE: should generate unique IDs for multiple tasks', async () => {
            // Act
            const response1 = await request(app).post('/api/tasks').send({ name: 'Task 1' });
            const response2 = await request(app).post('/api/tasks').send({ name: 'Task 2' });
            const response3 = await request(app).post('/api/tasks').send({ name: 'Task 3' });
            
            // Assert
            expect(response1.body.data.id).toBeDefined();
            expect(response2.body.data.id).toBeDefined();
            expect(response3.body.data.id).toBeDefined();
            expect(response1.body.data.id).not.toBe(response2.body.data.id);
            expect(response2.body.data.id).not.toBe(response3.body.data.id);
        });

        test('EDGE CASE: should handle special characters in task name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: '<script>alert("XSS")</script>', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe('<script>alert("XSS")</script>');
        });

        test('EDGE CASE: should handle unicode characters in task name', async () => {
            // Act
            const response = await request(app)
                .post('/api/tasks')
                .send({ name: '测试任务 🚀', status: 'not started' });
            
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe('测试任务 🚀');
        });
    });

    describe('PUT /api/tasks/:id', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('HAPPY PATH: should update task name', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Original Name', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ name: 'Updated Name' });
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.message).toBe('Task updated successfully');
        });

        test('HAPPY PATH: should update task status', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ status: 'in progress' });
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('in progress');
            expect(response.body.data.name).toBe('Task'); // Name unchanged
        });

        test('HAPPY PATH: should update task priority', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', priority: '1' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ priority: '3' });
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.data.priority).toBe('3');
        });

        test('HAPPY PATH: should update multiple fields at once', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started', priority: '1' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ name: 'New Name', status: 'completed', priority: '3' });
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.data).toMatchObject({
                name: 'New Name',
                status: 'completed',
                priority: '3'
            });
        });

        test('HAPPY PATH: should persist updates to storage', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ status: 'completed' });
            
            // Assert
            const fileData = await fs.readFile(TEST_STORAGE_FILE, 'utf8');
            const parsedData = JSON.parse(fileData);
            expect(parsedData.tasks[0].status).toBe('completed');
        });

        test('FAILURE MODE: should return 404 for non-existent task', async () => {
            // Act
            const response = await request(app)
                .put('/api/tasks/9999')
                .send({ name: 'Updated' });
            
            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Task not found');
        });

        test('FAILURE MODE: should return 400 for invalid task ID', async () => {
            // Act
            const response = await request(app)
                .put('/api/tasks/invalid')
                .send({ name: 'Updated' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid task ID');
        });

        test('FAILURE MODE: should reject empty name update', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ name: '' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Task name cannot be empty or whitespace only');
        });

        test('FAILURE MODE: should reject name exceeding max length', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task' });
            const taskId = createResponse.body.data.id;
            const longName = 'a'.repeat(201);
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ name: longName });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.errors).toContain('Task name cannot exceed 200 characters');
        });

        test('FAILURE MODE: should reject invalid priority update', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ priority: '10' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.errors).toContain('Priority must be 1, 2, or 3');
        });

        test('FAILURE MODE: should reject invalid status update', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ status: 'invalid' });
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.errors).toContain('Status must be "not started", "in progress", or "completed"');
        });

        test('EDGE CASE: should handle partial updates without affecting other fields', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started', priority: '1' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ status: 'in progress' });
            
            // Assert
            expect(response.body.data).toMatchObject({
                name: 'Task',
                status: 'in progress',
                priority: '1'
            });
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('HAPPY PATH: should delete an existing task', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task to Delete', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            const response = await request(app).delete(`/api/tasks/${taskId}`);
            
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(taskId);
            expect(response.body.message).toBe('Task deleted successfully');
        });

        test('HAPPY PATH: should remove task from list', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            await request(app).delete(`/api/tasks/${taskId}`);
            
            // Assert
            const getResponse = await request(app).get('/api/tasks');
            expect(getResponse.body.data).toHaveLength(0);
        });

        test('HAPPY PATH: should persist deletion to storage', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Task', status: 'not started' });
            const taskId = createResponse.body.data.id;
            
            // Act
            await request(app).delete(`/api/tasks/${taskId}`);
            
            // Assert
            const fileData = await fs.readFile(TEST_STORAGE_FILE, 'utf8');
            const parsedData = JSON.parse(fileData);
            expect(parsedData.tasks).toHaveLength(0);
        });

        test('FAILURE MODE: should return 404 for non-existent task', async () => {
            // Act
            const response = await request(app).delete('/api/tasks/9999');
            
            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Task not found');
        });

        test('FAILURE MODE: should return 400 for invalid task ID', async () => {
            // Act
            const response = await request(app).delete('/api/tasks/invalid');
            
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid task ID');
        });

        test('EDGE CASE: should delete correct task among multiple', async () => {
            // Arrange
            const response1 = await request(app).post('/api/tasks').send({ name: 'Task 1' });
            const response2 = await request(app).post('/api/tasks').send({ name: 'Task 2' });
            const response3 = await request(app).post('/api/tasks').send({ name: 'Task 3' });
            const taskId = response2.body.data.id;
            
            // Act
            await request(app).delete(`/api/tasks/${taskId}`);
            
            // Assert
            const getResponse = await request(app).get('/api/tasks');
            expect(getResponse.body.data).toHaveLength(2);
            expect(getResponse.body.data.find(t => t.id === taskId)).toBeUndefined();
            expect(getResponse.body.data.find(t => t.name === 'Task 1')).toBeDefined();
            expect(getResponse.body.data.find(t => t.name === 'Task 3')).toBeDefined();
        });

        test('EDGE CASE: should handle deletion of last remaining task', async () => {
            // Arrange
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Last Task' });
            const taskId = createResponse.body.data.id;
            
            // Act
            await request(app).delete(`/api/tasks/${taskId}`);
            
            // Assert
            const getResponse = await request(app).get('/api/tasks');
            expect(getResponse.body.data).toHaveLength(0);
        });
    });

    describe('Integration Tests', () => {
        
        beforeEach(async () => {
            await cleanupStorage();
        });

        test('COMPLETE WORKFLOW: create, read, update, delete task', async () => {
            // Create
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ name: 'Workflow Task', status: 'not started', priority: '1' });
            expect(createResponse.status).toBe(201);
            const taskId = createResponse.body.data.id;
            
            // Read
            const getResponse = await request(app).get(`/api/tasks/${taskId}`);
            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data.name).toBe('Workflow Task');
            
            // Update
            const updateResponse = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ status: 'completed' });
            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.data.status).toBe('completed');
            
            // Delete
            const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
            expect(deleteResponse.status).toBe(200);
            
            // Verify deletion
            const verifyResponse = await request(app).get(`/api/tasks/${taskId}`);
            expect(verifyResponse.status).toBe(404);
        });

        test('PERSISTENCE: tasks should persist across operations', async () => {
            // Create multiple tasks
            await request(app).post('/api/tasks').send({ name: 'Task 1', status: 'not started' });
            await request(app).post('/api/tasks').send({ name: 'Task 2', status: 'in progress' });
            await request(app).post('/api/tasks').send({ name: 'Task 3', status: 'completed' });
            
            // Verify all persisted
            const response = await request(app).get('/api/tasks');
            expect(response.body.data).toHaveLength(3);
            
            // Verify storage file
            const fileData = await fs.readFile(TEST_STORAGE_FILE, 'utf8');
            const parsedData = JSON.parse(fileData);
            expect(parsedData.tasks).toHaveLength(3);
        });

        test('BULK OPERATIONS: handle multiple creates, updates, and deletes', async () => {
            // Create 5 tasks
            const tasks = [];
            for (let i = 1; i <= 5; i++) {
                const response = await request(app)
                    .post('/api/tasks')
                    .send({ name: `Task ${i}`, status: 'not started', priority: '1' });
                tasks.push(response.body.data);
            }
            
            // Update all tasks
            for (const task of tasks) {
                await request(app)
                    .put(`/api/tasks/${task.id}`)
                    .send({ status: 'in progress' });
            }
            
            // Delete first 3 tasks
            for (let i = 0; i < 3; i++) {
                await request(app).delete(`/api/tasks/${tasks[i].id}`);
            }
            
            // Verify final state
            const response = await request(app).get('/api/tasks');
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.every(t => t.status === 'in progress')).toBe(true);
        });
    });
});
