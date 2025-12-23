Feature: TO-DO List Application
  As a user
  I want to manage my tasks with priorities and statuses
  So that I can organize my work effectively

  Background:
    Given the TO-DO application is open
    And the task list is empty

  Scenario: Add a new task with default values
    Given I am on the TO-DO list page
    When I enter "Buy groceries" in the task name field
    And I click the "Add" button
    Then I should see a new task "Buy groceries" in the list
    And the task should have priority "1 (Low)"
    And the task should have status "Not Started"
    And the task should be highlighted in red
    And the task name field should be cleared
    And the focus should return to the task name field

  Scenario: Add a task with high priority and in progress status
    Given I am on the TO-DO list page
    When I enter "Complete project presentation" in the task name field
    And I select priority "3 (High)"
    And I select status "In Progress"
    And I click the "Add" button
    Then I should see a new task "Complete project presentation" in the list
    And the task should have priority "3 (High)"
    And the task should have status "In Progress"
    And the task should be highlighted in orange
    And the task should appear at the bottom of the list

  Scenario: Edit task priority and status
    Given I have a task "Write documentation" with priority "1 (Low)" and status "Not Started"
    When I click on the task "Write documentation"
    Then the edit controls should be displayed
    When I change the priority to "2 (Medium)"
    And I change the status to "In Progress"
    And I click "Save Changes"
    Then the task should have priority "2 (Medium)"
    And the task should have status "In Progress"
    And the task should be highlighted in orange
    And the edit controls should be hidden

  Scenario: Delete a task
    Given I have a task "Old task to delete" in the list
    When I click the "Delete" button for task "Old task to delete"
    Then a confirmation dialog should appear with message "Are you sure you want to delete this item?"
    When I click "OK" in the confirmation dialog
    Then the task "Old task to delete" should be removed from the list
    And the total task count should decrease by 1

  Scenario: Cancel task deletion
    Given I have a task "Important task" in the list
    When I click the "Delete" button for task "Important task"
    Then a confirmation dialog should appear
    When I click "Cancel" in the confirmation dialog
    Then the task "Important task" should still be visible in the list
    And the total task count should remain unchanged

  Scenario: Toggle edit mode on and off
    Given I have a task "Sample task" in the list
    When I click on the task "Sample task"
    Then the edit controls should be displayed
    And the task should have class "editing"
    When I click on the task "Sample task" again
    Then the edit controls should be hidden
    And the task should not have class "editing"

  Scenario: Add multiple tasks with different priorities
    Given I am on the TO-DO list page
    When I add a task "Low priority task" with priority "1 (Low)" and status "Not Started"
    And I add a task "Medium priority task" with priority "2 (Medium)" and status "Not Started"
    And I add a task "High priority task" with priority "3 (High)" and status "Not Started"
    Then I should see 3 tasks in the list
    And all tasks should have different priority badges
    And all tasks should be highlighted in red

  Scenario: Task status color highlighting
    Given I am on the TO-DO list page
    When I add a task "Not Started Task" with status "Not Started"
    And I add a task "In Progress Task" with status "In Progress"
    And I add a task "Completed Task" with status "Completed"
    Then the task "Not Started Task" should be highlighted in red with left border
    And the task "In Progress Task" should be highlighted in orange with left border
    And the task "Completed Task" should be highlighted in green with left border

  Scenario: Validate empty task name
    Given I am on the TO-DO list page
    When I leave the task name field empty
    And I click the "Add" button
    Then an alert should appear with message "Please enter a task name!"
    And no new task should be added to the list

  Scenario: Validate task name with only whitespace
    Given I am on the TO-DO list page
    When I enter "   " (only spaces) in the task name field
    And I click the "Add" button
    Then an alert should appear with message "Please enter a task name!"
    And no new task should be added to the list

  Scenario: Validate maximum task name length
    Given I am on the TO-DO list page
    When I enter a task name with 201 characters
    And I click the "Add" button
    Then an alert should appear with message "Task name is too long! Maximum 200 characters allowed."
    And no new task should be added to the list

  Scenario: Add task with exactly 200 characters
    Given I am on the TO-DO list page
    When I enter a task name with exactly 200 characters
    And I click the "Add" button
    Then the task should be added successfully
    And the full task name should be displayed

  Scenario: Add task using Enter key
    Given I am on the TO-DO list page
    And the task name field has focus
    When I enter "Quick task" in the task name field
    And I press the "Enter" key
    Then a new task "Quick task" should be added to the list
    And the task should have default priority "1 (Low)"
    And the task should have default status "Not Started"

  Scenario: Edit task and cancel by clicking outside
    Given I have a task "Editable task" with priority "1 (Low)" and status "Not Started"
    When I click on the task "Editable task"
    Then the edit controls should be displayed
    When I click on another task or empty space
    Then the edit controls should remain open
    And no changes should be saved until "Save Changes" is clicked

  Scenario: Handle special characters in task name
    Given I am on the TO-DO list page
    When I enter "Task with <script>alert('XSS')</script> in name" in the task name field
    And I click the "Add" button
    Then the task should be added successfully
    And the task name should display the text exactly as entered
    And no script should be executed
    And the HTML should be properly escaped

  Scenario: Handle unicode characters in task name
    Given I am on the TO-DO list page
    When I enter "测试任务 🚀 Task with émojis" in the task name field
    And I click the "Add" button
    Then the task should be added successfully
    And the task name should display "测试任务 🚀 Task with émojis" correctly

  Scenario: Data persistence across page reload (localStorage mode)
    Given the application is running in localStorage mode
    And I have added 3 tasks to the list
    When I refresh the page
    Then all 3 tasks should still be visible
    And all task properties (name, priority, status) should be preserved
    And the color highlighting should be maintained

  Scenario: Switch between edit modes for multiple tasks
    Given I have tasks "Task A" and "Task B" in the list
    When I click on "Task A"
    Then edit controls for "Task A" should be displayed
    When I click on "Task B"
    Then edit controls for "Task B" should be displayed
    And edit controls for "Task A" should be hidden
    And only one task should be in edit mode at a time

  Scenario: Complete workflow - Add, Edit, Complete, Delete
    Given I am on the TO-DO list page
    When I add a task "Workflow test task" with priority "2 (Medium)" and status "Not Started"
    Then the task should be highlighted in red
    When I click on the task "Workflow test task"
    And I change the status to "In Progress"
    And I click "Save Changes"
    Then the task should be highlighted in orange
    When I click on the task "Workflow test task"
    And I change the status to "Completed"
    And I click "Save Changes"
    Then the task should be highlighted in green
    When I click the "Delete" button for task "Workflow test task"
    And I confirm the deletion
    Then the task should be removed from the list

  Scenario: Empty state display
    Given the TO-DO list is empty
    Then I should see an empty state message
    And the message should indicate "No tasks yet. Add one above!"

  Scenario: Task list with mixed statuses and priorities
    Given I am on the TO-DO list page
    When I add the following tasks:
      | Name                    | Priority | Status       |
      | Critical bug fix        | 3        | In Progress  |
      | Code review             | 2        | Not Started  |
      | Team meeting            | 1        | Completed    |
      | Documentation update    | 2        | In Progress  |
      | Deploy to production    | 3        | Not Started  |
    Then I should see 5 tasks in the list
    And each task should have the correct color highlighting
    And each task should display the correct priority badge
    And each task should show the correct status badge

Feature: TO-DO List API Integration
  As a user
  I want my tasks to be synchronized with the backend
  So that my data persists even when the server restarts

  Background:
    Given the API server is running on "http://localhost:3000"
    And the application is open in API mode

  Scenario: Detect API availability on load
    Given the API server is running
    When I open the application
    Then the browser console should show "✅ Using API backend"
    And tasks should be loaded from the API

  Scenario: Fallback to localStorage when API unavailable
    Given the API server is not running
    When I open the application
    Then the browser console should show "⚠️ API unavailable, using localStorage"
    And tasks should be loaded from localStorage

  Scenario: Create task via API
    Given the API server is running
    And the application is in API mode
    When I add a task "API Test Task" with priority "2" and status "In Progress"
    Then a POST request should be sent to "/api/tasks"
    And the response should return status 201
    And the task should appear in the list
    And the tasks.json file should contain the new task

  Scenario: Update task via API
    Given the API server is running
    And I have a task "API Task to Update" with id 1
    When I edit the task and change status to "Completed"
    And I click "Save Changes"
    Then a PUT request should be sent to "/api/tasks/1"
    And the response should return status 200
    And the task should be updated in the list
    And the tasks.json file should reflect the update

  Scenario: Delete task via API
    Given the API server is running
    And I have a task "API Task to Delete" with id 1
    When I delete the task
    And I confirm the deletion
    Then a DELETE request should be sent to "/api/tasks/1"
    And the response should return status 200
    And the task should be removed from the list
    And the tasks.json file should not contain the task

  Scenario: Load existing tasks from API on startup
    Given the API server has 3 tasks stored in tasks.json
    When I open the application
    Then a GET request should be sent to "/api/tasks"
    And all 3 tasks should be loaded into the application
    And the tasks should be displayed with correct highlighting

  Scenario: API error handling - Failed to create task
    Given the API server is running
    When I add a task with invalid data that causes API error
    Then an error alert should be displayed
    And the application should fallback to localStorage mode
    And the task should be saved locally

  Scenario: Data persistence after server restart
    Given the API server is running
    And I have added 5 tasks via the application
    When I stop the server
    And I restart the server
    And I refresh the application
    Then all 5 tasks should still be visible
    And all task data should be intact

  Scenario: Synchronization between multiple browser tabs (API mode)
    Given the API server is running
    And I have the application open in two browser tabs
    When I add a task "Sync Test" in tab 1
    And I refresh tab 2
    Then the task "Sync Test" should appear in tab 2
    And both tabs should show the same tasks

Feature: TO-DO List Responsive Design
  As a user on different devices
  I want the application to work well on various screen sizes
  So that I can manage tasks on desktop, tablet, or mobile

  Scenario: Desktop view layout
    Given I open the application on a desktop browser
    When the viewport width is 1200px or more
    Then the application should display in full width
    And all controls should be clearly visible
    And the form should be horizontal layout

  Scenario: Tablet view layout
    Given I open the application on a tablet
    When the viewport width is between 768px and 1199px
    Then the application should adjust its layout
    And all functionality should remain accessible
    And text should be readable without zooming

  Scenario: Mobile view layout
    Given I open the application on a mobile device
    When the viewport width is less than 768px
    Then the application should use mobile-optimized layout
    And buttons should be large enough for touch interaction
    And the form elements should stack vertically

  Scenario: Touch interactions on mobile
    Given I am using the application on a touchscreen device
    When I tap on a task
    Then the edit controls should expand
    And the controls should be easy to interact with using touch
    And buttons should have adequate spacing for fingers
