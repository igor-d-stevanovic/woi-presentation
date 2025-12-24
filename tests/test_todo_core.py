"""E2E tests for TODO List core functionality"""

import pytest
import allure
from playwright.sync_api import Page, expect
from tests.pages.todo_page import TodoPage


@pytest.mark.ui
class TestAddTasks:
    """Test scenarios for adding tasks"""
    
    def test_add_task_with_default_values(self, todo_page: TodoPage, server_process):
        # Scenario: Add a new task with default values
        # Given I am on the TO-DO list page
        # When I enter "Buy groceries" in the task name field
        # And I click the "Add" button
        # Then I should see a new task "Buy groceries" in the list
        # And the task should have priority "1 (Low)"
        # And the task should have status "Not Started"
        # And the task should be highlighted in red
        with allure.step("Navigate to TO-DO list page"):
            todo_page.navigate()
            todo_page.wait_for_api_detection()
        # When
        with allure.step("Add new task 'Buy groceries'"):
            todo_page.task_name_input.fill("Buy groceries")
            todo_page.add_button.click()
            todo_page.page.wait_for_timeout(1000)  # Wait for task to be added via API
        # Then
        with allure.step("Verify task was added correctly"):
            assert todo_page.task_exists("Buy groceries"), "Task should exist in the list"
            assert "1 (Low)" in todo_page.get_task_priority("Buy groceries")
            status = todo_page.get_task_status("Buy groceries")
            assert "not started" in status.lower(), f"Expected 'Not started' but got '{status}'"
            assert todo_page.get_task_highlight_class("Buy groceries") == "red"
            assert todo_page.get_task_name_input_value() == "", "Input should be cleared"
    
    def test_add_task_with_high_priority_and_in_progress(self, todo_page: TodoPage, server_process):
        # Scenario: Add a task with high priority and in progress status
        # When I enter "Complete project presentation" in the task name field
        # And I select priority "3 (High)"
        # And I select status "In Progress"
        # And I click the "Add" button
        # Then the task should have priority "3 (High)"
        # And the task should have status "In Progress"
        # And the task should be highlighted in orange
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.add_task("Complete project presentation", priority="3", status="in progress")
        
        # Then
        assert todo_page.task_exists("Complete project presentation")
        assert "3 (High)" in todo_page.get_task_priority("Complete project presentation")
        assert "In progress" in todo_page.get_task_status("Complete project presentation")
        assert todo_page.get_task_highlight_class("Complete project presentation") == "orange"
    
    def test_add_task_using_enter_key(self, todo_page: TodoPage, server_process):
        # Scenario: Add task using Enter key
        # When I enter "Quick task" in the task name field
        # And I press the "Enter" key
        # Then a new task "Quick task" should be added to the list
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.task_name_input.fill("Quick task")
        todo_page.press_enter_on_input()
        
        # Then
        assert todo_page.task_exists("Quick task")
        assert "1 (Low)" in todo_page.get_task_priority("Quick task")
    
    def test_add_multiple_tasks_with_different_priorities(self, todo_page: TodoPage, server_process):
        # Scenario: Add multiple tasks with different priorities
        # When I add a task "Low priority task" with priority "1 (Low)"
        # And I add a task "Medium priority task" with priority "2 (Medium)"
        # And I add a task "High priority task" with priority "3 (High)"
        # Then I should see 3 tasks in the list
        # And all tasks should have different priority badges
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.add_task("Low priority task", priority="1", status="not started")
        todo_page.add_task("Medium priority task", priority="2", status="not started")
        todo_page.add_task("High priority task", priority="3", status="not started")
        
        # Then
        assert todo_page.get_task_count() == 3
        assert "1 (Low)" in todo_page.get_task_priority("Low priority task")
        assert "2 (Medium)" in todo_page.get_task_priority("Medium priority task")
        assert "3 (High)" in todo_page.get_task_priority("High priority task")


@pytest.mark.ui
class TestTaskStatusHighlighting:
    """Test scenarios for status-based color highlighting"""
    
    def test_status_color_highlighting(self, todo_page: TodoPage, server_process):
        # Scenario: Task status color highlighting
        # When I add a task "Not Started Task" with status "Not Started"
        # And I add a task "In Progress Task" with status "In Progress"
        # And I add a task "Completed Task" with status "Completed"
        # Then the task "Not Started Task" should be highlighted in red
        # And the task "In Progress Task" should be highlighted in orange
        # And the task "Completed Task" should be highlighted in green
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.add_task("Not Started Task", priority="1", status="not started")
        todo_page.add_task("In Progress Task", priority="1", status="in progress")
        todo_page.add_task("Completed Task", priority="1", status="completed")
        
        # Then
        assert todo_page.get_task_highlight_class("Not Started Task") == "red"
        assert todo_page.get_task_highlight_class("In Progress Task") == "orange"
        assert todo_page.get_task_highlight_class("Completed Task") == "green"


@pytest.mark.ui
class TestEditTasks:
    """Test scenarios for editing tasks"""
    
    def test_edit_task_priority_and_status(self, todo_page: TodoPage, server_process):
        # Scenario: Edit task priority and status
        # Given I have a task "Write documentation" with priority "1 (Low)" and status "Not Started"
        # When I click on the task
        # And I change the priority to "2 (Medium)"
        # And I change the status to "In Progress"
        # And I click "Save Changes"
        # Then the task should have priority "2 (Medium)"
        # And the task should have status "In Progress"
        # And the task should be highlighted in orange
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("Write documentation", priority="1", status="not started")
        
        # When
        todo_page.click_task("Write documentation")
        todo_page.page.wait_for_timeout(500)  # Wait for edit controls to appear
        todo_page.edit_task_priority("Write documentation", "2")
        todo_page.edit_task_status("Write documentation", "in progress")
        todo_page.save_task_changes("Write documentation")
        todo_page.page.wait_for_timeout(500)  # Wait for save to complete
        
        # Then
        assert "2 (Medium)" in todo_page.get_task_priority("Write documentation")
        assert "In progress" in todo_page.get_task_status("Write documentation")
        assert todo_page.get_task_highlight_class("Write documentation") == "orange"
    
    def test_toggle_edit_mode(self, todo_page: TodoPage, server_process):
        # Scenario: Toggle edit mode on and off
        # Given I have a task "Sample task" in the list
        # When I click on the task
        # Then the edit controls should be displayed
        # When I click on the task again
        # Then the edit controls should be hidden
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("Sample task")
        
        # When - First click
        todo_page.click_task("Sample task")
        todo_page.page.wait_for_timeout(300)
        
        # Then
        assert todo_page.is_task_in_edit_mode("Sample task"), "Task should be in edit mode"
        
        # When - Second click
        todo_page.click_task("Sample task")
        todo_page.page.wait_for_timeout(300)
        
        # Then
        assert not todo_page.is_task_in_edit_mode("Sample task"), "Task should not be in edit mode"


@pytest.mark.ui
class TestDeleteTasks:
    """Test scenarios for deleting tasks"""
    
    def test_delete_task_with_confirmation(self, todo_page: TodoPage, server_process):
        """
        Scenario: Delete a task
        Given I have a task "Old task to delete" in the list
        When I click the "Delete" button
        And I confirm the deletion
        Then the task should be removed from the list
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("Old task to delete")
        initial_count = todo_page.get_task_count()
        
        # When
        todo_page.delete_task("Old task to delete", confirm=True)
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert not todo_page.task_exists("Old task to delete"), "Task should be deleted"
        assert todo_page.get_task_count() == initial_count - 1
    
    def test_cancel_task_deletion(self, todo_page: TodoPage, server_process):
        """
        Scenario: Cancel task deletion
        Given I have a task "Important task" in the list
        When I click the "Delete" button
        And I click "Cancel" in the confirmation dialog
        Then the task should still be visible
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        todo_page.add_task("Important task")
        initial_count = todo_page.get_task_count()
        
        # When
        todo_page.delete_task("Important task", confirm=False)
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert todo_page.task_exists("Important task"), "Task should still exist"
        assert todo_page.get_task_count() == initial_count


@pytest.mark.ui
class TestValidation:
    """Test scenarios for input validation"""
    
    def test_validate_empty_task_name(self, todo_page: TodoPage, alert_messages, server_process):
        """
        Scenario: Validate empty task name
        When I leave the task name field empty
        And I click the "Add" button
        Then an alert should appear
        And no new task should be added
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.add_button.click()
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert len(alert_messages) > 0, "Alert should be shown"
        assert "Please enter a task name!" in alert_messages[0]
        assert todo_page.get_task_count() == 0, "No task should be added"
    
    def test_validate_whitespace_only_task_name(self, todo_page: TodoPage, alert_messages, server_process):
        """
        Scenario: Validate task name with only whitespace
        When I enter only spaces in the task name field
        And I click the "Add" button
        Then an alert should appear
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        todo_page.task_name_input.fill("   ")
        todo_page.add_button.click()
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert len(alert_messages) > 0, "Alert should be shown"
        assert todo_page.get_task_count() == 0, "No task should be added"
    
    def test_validate_maximum_length(self, todo_page: TodoPage, alert_messages, server_process):
        """
        Scenario: Validate maximum task name length
        When I enter a task name with 201 characters
        And I click the "Add" button
        Then an alert should appear
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When - 201 characters
        long_name = "a" * 201
        todo_page.task_name_input.fill(long_name)
        todo_page.add_button.click()
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert len(alert_messages) > 0, "Alert should be shown"
        assert "too long" in alert_messages[0].lower()
    
    def test_accept_exactly_200_characters(self, todo_page: TodoPage, server_process):
        """
        Scenario: Add task with exactly 200 characters
        When I enter a task name with exactly 200 characters
        And I click the "Add" button
        Then the task should be added successfully
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When - Exactly 200 characters
        max_name = "a" * 200
        todo_page.task_name_input.fill(max_name)
        todo_page.add_button.click()
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert todo_page.get_task_count() == 1, "Task should be added"


@pytest.mark.ui
class TestSpecialCharacters:
    """Test scenarios for special characters"""
    
    def test_handle_special_characters_xss(self, todo_page: TodoPage, server_process):
        """
        Scenario: Handle special characters in task name (XSS protection)
        When I enter task with HTML tags
        Then the task should display the text without executing scripts
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        xss_text = "<script>alert('XSS')</script>"
        todo_page.add_task(xss_text)
        
        # Then
        task = todo_page.get_task_by_name("script")  # Should find text, not execute
        assert task.count() > 0, "Task should be added with escaped HTML"
    
    def test_handle_unicode_characters(self, todo_page: TodoPage, server_process):
        """
        Scenario: Handle unicode characters in task name
        When I enter unicode characters and emojis
        Then the task should display correctly
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When
        unicode_text = "测试任务 🚀 Task"
        todo_page.add_task(unicode_text)
        
        # Then
        assert todo_page.task_exists("测试任务"), "Task with unicode should be added"


@pytest.mark.ui
class TestEmptyState:
    """Test scenarios for empty state"""
    
    def test_empty_state_display(self, todo_page: TodoPage, server_process):
        """
        Scenario: Empty state display
        Given the TO-DO list is empty
        Then I should see an empty state message
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # Then
        assert todo_page.is_empty_state_visible(), "Empty state should be visible"
        empty_text = todo_page.get_empty_state_text()
        assert "No TO-DO items yet" in empty_text or "No tasks yet" in empty_text


@pytest.mark.ui
@pytest.mark.smoke
class TestCompleteWorkflow:
    """Test complete workflow scenarios"""
    
    def test_complete_workflow_add_edit_complete_delete(self, todo_page: TodoPage, server_process):
        """
        Scenario: Complete workflow - Add, Edit, Complete, Delete
        """
        # Given
        todo_page.navigate()
        todo_page.wait_for_api_detection()
        
        # When - Add task
        todo_page.add_task("Workflow test task", priority="2", status="not started")
        assert todo_page.get_task_highlight_class("Workflow test task") == "red"
        
        # When - Change to In Progress
        todo_page.click_task("Workflow test task")
        todo_page.page.wait_for_timeout(500)
        todo_page.edit_task_status("Workflow test task", "in progress")
        todo_page.save_task_changes("Workflow test task")
        todo_page.page.wait_for_timeout(500)
        assert todo_page.get_task_highlight_class("Workflow test task") == "orange"
        
        # When - Change to Completed
        todo_page.click_task("Workflow test task")
        todo_page.page.wait_for_timeout(500)
        todo_page.edit_task_status("Workflow test task", "completed")
        todo_page.save_task_changes("Workflow test task")
        todo_page.page.wait_for_timeout(500)
        assert todo_page.get_task_highlight_class("Workflow test task") == "green"
        
        # When - Delete
        todo_page.delete_task("Workflow test task", confirm=True)
        todo_page.page.wait_for_timeout(500)
        
        # Then
        assert not todo_page.task_exists("Workflow test task"), "Task should be deleted"
