import requests
import json

demo_code = """import sqlite3, os, hashlib

DB_PASS = "admin123"
SECRET = "jwt_secret_hardcoded"

def get_user(username):
    conn = sqlite3.connect("app.db")
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM users WHERE name = '{username}'")
    return cur.fetchone()

def run_cmd(user_input):
    os.system("ping " + user_input)

def weak_hash(password):
    return hashlib.md5(password.encode()).hexdigest()
"""

try:
    res = requests.post("http://localhost:8000/api/scan", json={"code": demo_code, "language": "python"})
    print("STATUS CODE:", res.status_code)
    print("RESPONSE JSON:")
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print("ERROR:", e)
