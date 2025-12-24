"""Pytest configuration and fixtures for E2E tests"""

import pytest
import allure
from playwright.sync_api import Page, Browser, sync_playwright
from tests.pages.todo_page import TodoPage
import subprocess
import time
import os
import signal


@pytest.fixture(scope="session")
def browser():
    """Create a browser instance for the test session"""
    headless_env = os.getenv("HEADLESS", "true").lower() == "true"
    with allure.step("Launch Playwright browser"):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless_env)
            yield browser
            browser.close()


@pytest.fixture(scope="function")
def page(browser: Browser):
    """Create a new page for each test"""
    with allure.step("Create new browser context and page"):
        context = browser.new_context()
        page = context.new_page()
        yield page
        page.close()
        context.close()


@pytest.fixture(scope="function")
def todo_page(page: Page):
    """Create TodoPage object"""
    with allure.step("Create TodoPage object"):
        return TodoPage(page)


@pytest.fixture(scope="session")
def server_process():
    """Start the Express server for tests"""
    # Check if server is already running
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', 3000))
    sock.close()
    
    if result == 0:
        # Server already running
        print("\n✅ Server already running on port 3000")
        yield None
        return
    
    # Start the server
    print("\n🚀 Starting server on port 3000...")
    server = subprocess.Popen(
        ["node", "server.js"],
        cwd=os.path.dirname(os.path.dirname(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    
    # Wait for server to start
    time.sleep(2)
    
    # Verify server is running
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', 3000))
    sock.close()
    
    if result != 0:
        raise Exception("Failed to start server")
    
    print("✅ Server started successfully")
    
    yield server
    
    # Cleanup: Stop the server
    print("\n🛑 Stopping server...")
    if os.name == 'nt':
        # Windows
        server.send_signal(signal.CTRL_BREAK_EVENT)
    else:
        # Unix
        server.terminate()
    server.wait(timeout=5)
    print("✅ Server stopped")


@pytest.fixture(scope="function", autouse=True)
def cleanup_tasks(server_process):
    """Clean up tasks before and after each test"""
    import requests
    import json
    import time
    
    # Clean up before test
    try:
        response = requests.get("http://localhost:3000/api/tasks", timeout=5)
        if response.status_code == 200:
            tasks = response.json().get("data", [])
            for task in tasks:
                requests.delete(f"http://localhost:3000/api/tasks/{task['id']}", timeout=5)
        time.sleep(0.5)  # Wait for cleanup to complete
    except:
        pass
    
    yield
    
    # Clean up after test
    try:
        response = requests.get("http://localhost:3000/api/tasks", timeout=5)
        if response.status_code == 200:
            tasks = response.json().get("data", [])
            for task in tasks:
                requests.delete(f"http://localhost:3000/api/tasks/{task['id']}", timeout=5)
        time.sleep(0.5)  # Wait for cleanup to complete
    except:
        pass


@pytest.fixture
def alert_messages(page: Page):
    """Capture alert messages"""
    messages = []
    
    def handle_dialog(dialog):
        messages.append(dialog.message)
        dialog.accept()
    
    page.on("dialog", handle_dialog)
    
    yield messages


@pytest.fixture
def console_messages(page: Page):
    """Capture console messages"""
    messages = []
    
    def handle_console(msg):
        messages.append({"type": msg.type, "text": msg.text})
    
    page.on("console", handle_console)
    
    yield messages
