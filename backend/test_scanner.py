import pytest
from scanner import fallback_static_analysis

def test_sql_injection_detection():
    code = 'cur.execute(f"SELECT * FROM users WHERE name = \'{username}\'")'
    result = fallback_static_analysis(code, "python")
    
    assert result.risk_level == "critical"
    assert len(result.vulnerabilities) > 0
    sql_vuln = next((v for v in result.vulnerabilities if v.cwe_id == "CWE-89"), None)
    assert sql_vuln is not None
    assert sql_vuln.category == "Injection Flaws"
    assert sql_vuln.severity == "critical"
    assert sql_vuln.source == "static_fallback"
    assert sql_vuln.confidence == "high"

def test_hardcoded_secrets_detection():
    code = 'DB_PASS = "super_secret_admin_123"'
    result = fallback_static_analysis(code, "python")
    
    assert len(result.vulnerabilities) > 0
    secret_vuln = next((v for v in result.vulnerabilities if v.cwe_id == "CWE-798"), None)
    assert secret_vuln is not None
    assert secret_vuln.category == "Hardcoded Secrets"
    assert secret_vuln.severity == "high"
    assert secret_vuln.source == "static_fallback"
    assert secret_vuln.confidence == "high"

def test_command_injection_detection():
    code = 'import os\nos.system("ping " + user_input)'
    result = fallback_static_analysis(code, "python")
    
    assert len(result.vulnerabilities) > 0
    cmd_vuln = next((v for v in result.vulnerabilities if v.cwe_id == "CWE-78"), None)
    assert cmd_vuln is not None
    assert cmd_vuln.category == "Command Injection"
    assert cmd_vuln.severity == "critical"
    assert cmd_vuln.source == "static_fallback"

def test_weak_hashing_detection():
    code = 'import hashlib\nhash_val = hashlib.md5(password.encode()).hexdigest()'
    result = fallback_static_analysis(code, "python")
    
    assert len(result.vulnerabilities) > 0
    hash_vuln = next((v for v in result.vulnerabilities if v.cwe_id == "CWE-327"), None)
    assert hash_vuln is not None
    assert hash_vuln.category == "Broken Cryptography"
    assert hash_vuln.severity == "medium"
    assert hash_vuln.source == "static_fallback"

def test_clean_code_security():
    code = 'def add(a, b):\n    return a + b'
    result = fallback_static_analysis(code, "python")
    
    assert result.score == 100
    assert result.risk_level == "secure"
    assert len(result.vulnerabilities) == 0
