"""E2E tests for API integration"""
import pytest
import requests
from tests.pages.todo_page import TodoPage


@pytest.mark.api
class TestAPIIntegration:
    """Test scenarios for API integration"""
    
    def test_detect_api_availability(self, todo_page: TodoPage, console_messages, server_process):
        """
        Scenario: Detect API availability on load
        Given the API server is running
        When I open the application
        Then the browser console should show "Using API backend"
        """
        # When
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # Then
        console_logs = [msg["text"] for msg in console_messages if msg["type"] == "log"]
        api_detected = any("Using API backend" in log for log in console_logs)
        assert api_detected, f"Should detect API. Console logs: {console_logs}"
    
    def test_create_task_via_api(self, todo_page: TodoPage, server_process):
        """
        Scenario: Create task via API
        When I add a task "API Test Task"
        Then the task should appear in the list
        And the tasks.json file should contain the new task
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.add_task("API Test Task", priority="2", status="in progress")
        todo_page.page.wait_for_timeout(1000)
        
        # Then - Check UI
        assert todo_page.task_exists("API Test Task")
        
        # Then - Check API
        response = requests.get("http://localhost:3000/api/tasks")
        assert response.status_code == 200
        tasks = response.json()["data"]
        api_task_names = [task["name"] for task in tasks]
        assert "API Test Task" in api_task_names
    
    def test_update_task_via_api(self, todo_page: TodoPage, server_process):
        """
        Scenario: Update task via API
        Given I have a task
        When I edit the task and change status to "Completed"
        Then the task should be updated in the API
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("API Task to Update", priority="1", status="not started")
        todo_page.page.wait_for_timeout(1000)
        
        # When
        todo_page.click_task("API Task to Update")
        todo_page.page.wait_for_timeout(500)
        todo_page.edit_task_status("API Task to Update", "completed")
        todo_page.save_task_changes("API Task to Update")
        todo_page.page.wait_for_timeout(1000)
        
        # Then - Check UI
        assert "Completed" in todo_page.get_task_status("API Task to Update")
        
        # Then - Check API
        response = requests.get("http://localhost:3000/api/tasks")
        tasks = response.json()["data"]
        updated_task = next((t for t in tasks if t["name"] == "API Task to Update"), None)
        assert updated_task is not None
        assert updated_task["status"] == "completed"
    
    def test_delete_task_via_api(self, todo_page: TodoPage, server_process):
        """
        Scenario: Delete task via API
        Given I have a task
        When I delete the task
        Then the task should be removed from the API
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("API Task to Delete", priority="1", status="not started")
        todo_page.page.wait_for_timeout(1000)
        
        # Get task ID from API
        response = requests.get("http://localhost:3000/api/tasks")
        tasks = response.json()["data"]
        task_to_delete = next((t for t in tasks if t["name"] == "API Task to Delete"), None)
        assert task_to_delete is not None
        task_id = task_to_delete["id"]
        
        # When
        todo_page.delete_task("API Task to Delete", confirm=True)
        todo_page.page.wait_for_timeout(1000)
        
        # Then - Check UI
        assert not todo_page.task_exists("API Task to Delete")
        
        # Then - Check API
        response = requests.get(f"http://localhost:3000/api/tasks/{task_id}")
        assert response.status_code == 404, "Task should not exist in API"
    
    def test_load_existing_tasks_from_api(self, todo_page: TodoPage, server_process):
        """
        Scenario: Load existing tasks from API on startup
        Given the API server has tasks stored
        When I open the application
        Then all tasks should be loaded
        """
        # Given - Create tasks via API
        requests.post("http://localhost:3000/api/tasks", json={
            "name": "Preloaded Task 1",
            "priority": "1",
            "status": "not started"
        })
        requests.post("http://localhost:3000/api/tasks", json={
            "name": "Preloaded Task 2",
            "priority": "2",
            "status": "in progress"
        })
        requests.post("http://localhost:3000/api/tasks", json={
            "name": "Preloaded Task 3",
            "priority": "3",
            "status": "completed"
        })
        
        # When
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.page.wait_for_timeout(1000)
        
        # Then
        assert todo_page.get_task_count() == 3, "Should load all 3 tasks"
        assert todo_page.task_exists("Preloaded Task 1")
        assert todo_page.task_exists("Preloaded Task 2")
        assert todo_page.task_exists("Preloaded Task 3")
        
        # Verify highlighting
        assert todo_page.get_task_highlight_class("Preloaded Task 1") == "red"
        assert todo_page.get_task_highlight_class("Preloaded Task 2") == "orange"
        assert todo_page.get_task_highlight_class("Preloaded Task 3") == "green"
    
    def test_data_persistence_after_page_refresh(self, todo_page: TodoPage, server_process):
        """
        Scenario: Data persistence after page refresh
        Given I have added tasks via the application
        When I refresh the page
        Then all tasks should still be visible
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("Persistent Task 1", priority="1", status="not started")
        todo_page.add_task("Persistent Task 2", priority="2", status="in progress")
        todo_page.page.wait_for_timeout(1000)
        
        # When
        todo_page.page.reload()
        todo_page.wait_for_api_detection()
        todo_page.page.wait_for_timeout(1000)
        
        # Then
        assert todo_page.get_task_count() == 2
        assert todo_page.task_exists("Persistent Task 1")
        assert todo_page.task_exists("Persistent Task 2")
        
        # Verify task properties preserved
        assert "1 (Low)" in todo_page.get_task_priority("Persistent Task 1")
        assert "2 (Medium)" in todo_page.get_task_priority("Persistent Task 2")


@pytest.mark.api
class TestAPIDirect:
    """Direct API tests without UI"""
    
    def test_api_get_all_tasks(self, server_process):
        """Test GET /api/tasks endpoint"""
        response = requests.get("http://localhost:3000/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_api_create_task(self, server_process):
        """Test POST /api/tasks endpoint"""
        response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "Direct API Task",
            "priority": "2",
            "status": "not started"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "Direct API Task"
        assert "id" in data["data"]
    
    def test_api_update_task(self, server_process):
        """Test PUT /api/tasks/:id endpoint"""
        # Create task first
        create_response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "Task to Update",
            "priority": "1",
            "status": "not started"
        })
        task_id = create_response.json()["data"]["id"]
        
        # Update task
        update_response = requests.put(f"http://localhost:3000/api/tasks/{task_id}", json={
            "status": "completed",
            "priority": "3"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "completed"
        assert data["data"]["priority"] == "3"
    
    def test_api_delete_task(self, server_process):
        """Test DELETE /api/tasks/:id endpoint"""
        # Create task first
        create_response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "Task to Delete",
            "priority": "1",
            "status": "not started"
        })
        task_id = create_response.json()["data"]["id"]
        
        # Delete task
        delete_response = requests.delete(f"http://localhost:3000/api/tasks/{task_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] is True
        
        # Verify deletion
        get_response = requests.get(f"http://localhost:3000/api/tasks/{task_id}")
        assert get_response.status_code == 404
    
    def test_api_validation_empty_name(self, server_process):
        """Test API validates empty task name"""
        response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "",
            "priority": "1",
            "status": "not started"
        })
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "errors" in data
    
    def test_api_validation_invalid_priority(self, server_process):
        """Test API validates invalid priority"""
        response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "Test Task",
            "priority": "10",
            "status": "not started"
        })
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
    
    def test_api_validation_invalid_status(self, server_process):
        """Test API validates invalid status"""
        response = requests.post("http://localhost:3000/api/tasks", json={
            "name": "Test Task",
            "priority": "1",
            "status": "invalid status"
        })
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
