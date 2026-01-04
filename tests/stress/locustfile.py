import random
import time
from locust import HttpUser, task, between

# Test Data
LANGUAGES = ["typescript", "javascript", "rust", "python", "html", "css", "go", "java"]
PROJECTS = ["DevMeter", "Locust-Stress-Test", "Personal-Blog", "Backend-API", "Frontend-UI"]
FILES = ["index.ts", "utils.py", "main.rs", "App.tsx", "styles.css", "schema.prisma"]

class ExtensionUser(HttpUser):
    wait_time = between(10, 30)  # Simulate developer typing
    
    def on_start(self):
        # In a real scenario, you'd load multiple valid keys
        self.api_key = "STRESS_TEST_KEY_PLACEHOLDER"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    @task(3)
    def send_heartbeat(self):
        payload = {
            "project": random.choice(PROJECTS),
            "language": random.choice(LANGUAGES),
            "file": random.choice(FILES),
            "type": "file",
            "is_save": random.choice([True, False]),
            "timestamp": int(time.time() * 1000)
        }
        with self.client.post("/api/heartbeat", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code == 401:
                response.success()  # Expecting 401 if placeholder key is used but we want to track load
            elif response.status_code == 200:
                response.success()

class WebUser(HttpUser):
    wait_time = between(2, 5)  # Simulate human browsing
    
    @task(2)
    def view_leaderboard(self):
        range_type = random.choice(["7d", "30d", "all"])
        self.client.get(f"/api/leaderboard?range={range_type}")

    @task(1)
    def view_stats(self):
        # Simulating public stats or common metrics fetching
        self.client.get("/api/stats/contribution")
