"""Page Object Model for TODO List Application"""
from playwright.sync_api import Page, expect
from typing import Literal


class TodoPage:
    """Page object for the TODO List application"""
    
    def __init__(self, page: Page, base_url: str = "http://localhost:3000"):
        self.page = page
        self.base_url = base_url
        
        # Locators
        self.task_name_input = page.locator("#todoName")
        self.add_button = page.locator("#addTodoBtn")
        self.status_select = page.locator("#todoStatus")
        self.todo_list = page.locator("#todoList")
        self.todo_items = page.locator(".todo-item")
        self.empty_message = page.locator(".empty-state")
        
    def navigate(self):
        """Navigate to the TODO app"""
        self.page.goto(self.base_url)
        self.page.wait_for_load_state("networkidle")
        
    def get_priority_radio(self, priority: str):
        """Get priority radio button by value"""
        return self.page.locator(f'input[name="priority"][value="{priority}"]')
    
    def add_task(self, name: str, priority: str = "1", status: str = "not started"):
        """Add a new task"""
        self.task_name_input.fill(name)
        self.get_priority_radio(priority).check()
        self.status_select.select_option(status)
        self.add_button.click()
        expect(self.get_task_by_name(name)).to_be_visible(timeout=3000)
        
    def get_task_by_name(self, name: str):
        """Get task element by name"""
        return self.page.locator(f'.todo-item:has-text("{name}")')
    
    def get_task_priority(self, task_name: str) -> str:
        """Get task priority text"""
        task = self.get_task_by_name(task_name)
        priority_text = task.locator(".priority-badge").text_content()
        return priority_text.strip()
    
    def get_task_status(self, task_name: str) -> str:
        """Get task status text"""
        task = self.get_task_by_name(task_name)
        status_text = task.locator(".status-badge").text_content()
        return status_text.strip()
    
    def get_task_highlight_class(self, task_name: str) -> str:
        """Get the highlight class of a task"""
        task = self.get_task_by_name(task_name)
        class_attr = task.get_attribute("class")
        
        if "status-highlight-not-started" in class_attr:
            return "red"
        elif "status-highlight-in-progress" in class_attr:
            return "orange"
        elif "status-highlight-completed" in class_attr:
            return "green"
        return "none"
    
    def click_task(self, task_name: str):
        """Click on a task to toggle edit mode"""
        task = self.get_task_by_name(task_name)
        task.click()
        
    def is_task_in_edit_mode(self, task_name: str) -> bool:
        """Check if task is in edit mode"""
        task = self.get_task_by_name(task_name)
        class_attr = task.get_attribute("class")
        return "editing" in class_attr
    
    def edit_task_priority(self, task_name: str, new_priority: str):
        """Change task priority in edit mode"""
        task = self.get_task_by_name(task_name)
        task_id = task.get_attribute("data-id")
        priority_radio = self.page.locator(f'input[name="edit-priority-{task_id}"][value="{new_priority}"]')
        priority_radio.check()
        
    def edit_task_status(self, task_name: str, new_status: str):
        """Change task status in edit mode"""
        task = self.get_task_by_name(task_name)
        task_id = task.get_attribute("data-id")
        status_select = self.page.locator(f'#edit-status-{task_id}')
        status_select.select_option(new_status)
        
    def save_task_changes(self, task_name: str):
        """Click Save Changes button for a task"""
        task = self.get_task_by_name(task_name)
        save_button = task.locator('button:has-text("Save Changes")')
        save_button.click()
        
    def delete_task(self, task_name: str, confirm: bool = True):
        """Delete a task"""
        task = self.get_task_by_name(task_name)
        delete_button = task.locator('button:has-text("Delete")')
        
        # Set up dialog handler before clicking
        if confirm:
            self.page.once("dialog", lambda dialog: dialog.accept())
        else:
            self.page.once("dialog", lambda dialog: dialog.dismiss())
        
        delete_button.click()
        if confirm:
            expect(self.get_task_by_name(task_name)).to_have_count(0, timeout=3000)
        
    def get_task_count(self) -> int:
        """Get the number of tasks in the list"""
        return self.todo_items.count()
    
    def is_empty_state_visible(self) -> bool:
        """Check if empty state message is visible"""
        return self.empty_message.is_visible()
    
    def get_empty_state_text(self) -> str:
        """Get empty state message text"""
        return self.empty_message.text_content().strip()
    
    def task_exists(self, task_name: str) -> bool:
        """Check if a task exists in the list"""
        return self.get_task_by_name(task_name).count() > 0
    
    def press_enter_on_input(self):
        """Press Enter key on the task name input"""
        self.task_name_input.press("Enter")
        
    def get_alert_text(self) -> str:
        """Get alert dialog text (needs to be set up with dialog handler)"""
        # This should be used with page.on("dialog") handler
        pass
    
    def is_task_name_input_focused(self) -> bool:
        """Check if task name input has focus"""
        return self.task_name_input.evaluate("el => el === document.activeElement")
    
    def get_task_name_input_value(self) -> str:
        """Get the current value of task name input"""
        return self.task_name_input.input_value()
    
    def get_console_messages(self) -> list:
        """Get console messages (needs to be set up with console listener)"""
        pass
    
    def wait_for_api_detection(self):
        """Wait for API detection to complete"""
        self.page.wait_for_timeout(1000)  # Give time for API detection
