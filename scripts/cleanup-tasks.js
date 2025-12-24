const http = require('http');

// Function to make HTTP request
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = {
                        status: res.statusCode,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function cleanupTasks() {
    try {
        console.log('🧹 Cleaning up all tasks from database...');

        // Get all tasks
        const getResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/tasks',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (getResponse.status !== 200) {
            console.log('❌ Failed to get tasks for cleanup');
            return;
        }

        const tasks = getResponse.body.data || [];
        console.log(`Found ${tasks.length} tasks to delete`);

        // Delete all tasks
        for (const task of tasks) {
            try {
                await makeRequest({
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/tasks/${task.id}`,
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ Deleted task ${task.id}`);
            } catch (error) {
                console.log(`❌ Failed to delete task ${task.id}:`, error.message);
            }
        }

        console.log('✅ Task cleanup completed');

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

cleanupTasks();