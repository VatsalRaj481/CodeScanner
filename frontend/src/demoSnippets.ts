export const DEMO_SNIPPETS: Record<string, string> = {
  python: `import sqlite3, os, hashlib

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
    return hashlib.md5(password.encode()).hexdigest()`,

  javascript: `const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const API_SECRET_KEY = "sk_live_99887766554433221100";
const DB_PASSWORD = "root_password_2024";

function authenticateUser(db, userInputQuery) {
    // Unsafe SQL query concatenation (CWE-89)
    const query = "SELECT * FROM accounts WHERE user = '" + userInputQuery + "'";
    return db.query(query);
}

function executeDiagnostic(host) {
    // Command Injection via unsanitized system execution (CWE-78)
    exec("nslookup " + host, (err, stdout) => {
        console.log(stdout);
    });
}

function evalUserScript(userScript) {
    // Dangerous dynamic code evaluation (CWE-95)
    return eval(userScript);
}

function hashPassword(pass) {
    // Insecure hashing algorithm MD5 (CWE-327)
    return crypto.createHash('md5').update(pass).digest('hex');
}`,

  typescript: `import * as child_process from 'child_process';
import * as crypto from 'crypto';

const JWT_SECRET: string = "super_secret_jwt_token_key_12345";
const AWS_ACCESS_KEY: string = "AKIAIOSFODNN7EXAMPLE";

export class UserService {
    private dbConnection: any;

    public async findUser(username: string): Promise<any> {
        // Direct string interpolation leading to SQL Injection (CWE-89)
        const sql: string = \`SELECT id, role, password FROM users WHERE username = '\${username}'\`;
        return this.dbConnection.query(sql);
    }

    public runSystemPing(targetHost: string): void {
        // OS Command Injection vulnerability (CWE-78)
        child_process.exec(\`ping -c 1 \${targetHost}\`);
    }

    public generateWeakChecksum(data: string): string {
        // Insecure hashing algorithm SHA-1 (CWE-327)
        return crypto.createHash('sha1').update(data).digest('hex');
    }
}`,

  php: `<?php
$db_pass = "root_password_123!";
$api_token = "bearer_token_xyz987654321";

function getUserProfile($pdo, $user_id) {
    // Unescaped user input inside SQL query (CWE-89)
    $query = "SELECT * FROM users WHERE id = " . $_GET['user_id'];
    return $pdo->query($query);
}

function runBackup($filename) {
    // Unsanitized shell command invocation (CWE-78)
    system("tar -czf backup.tar.gz " . $filename);
}

function loadUserData($serializedData) {
    // Dangerous PHP Object Deserialization (CWE-502)
    return unserialize($serializedData);
}

function generateHash($password) {
    // Weak cryptographic algorithm MD5 (CWE-327)
    return md5($password);
}
?>`,

  java: `import java.sql.*;
import java.io.*;
import java.security.MessageDigest;

public class SecurityAuditDemo {
    private static final String DATABASE_PASSWORD = "admin_super_secret_pass";
    private static final String PRIVATE_KEY = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC";

    public ResultSet searchUsers(Connection conn, String userInput) throws SQLException {
        // SQL Injection via concatenated raw query string (CWE-89)
        Statement statement = conn.createStatement();
        String sql = "SELECT * FROM clients WHERE account_name = '" + userInput + "'";
        return statement.executeQuery(sql);
    }

    public void pingHost(String ipAddress) throws IOException {
        // Command Injection vulnerability in Runtime execution (CWE-78)
        Runtime.getRuntime().exec("ping -c 3 " + ipAddress);
    }

    public Object deserializeObject(byte[] streamData) throws Exception {
        // Insecure Object InputStream Deserialization (CWE-502)
        ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(streamData));
        return in.readObject();
    }

    public String computeMD5(String input) throws Exception {
        // Insecure Cryptographic Hash Algorithm (CWE-327)
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes());
        return new String(digest);
    }
}`,

  go: `package main

import (
	"crypto/md5"
	"database/sql"
	"fmt"
	"os/exec"
)

const DBPassword = "postgres_master_pass_123"
const JWTSecret = "go_app_jwt_signing_key_secret"

func GetUserRecord(db *sql.DB, username string) (*sql.Rows, error) {
	// SQL Injection via Sprintf query string formatting (CWE-89)
	query := fmt.Sprintf("SELECT id, email FROM users WHERE name = '%s'", username)
	return db.Query(query)
}

func ExecutePing(userInput string) ([]byte, error) {
	// Command Injection via bash -c execution string (CWE-78)
	cmd := exec.Command("sh", "-c", "ping -c 1 "+userInput)
	return cmd.Output()
}

func HashUserPass(password string) string {
	// Weak Hash Algorithm MD5 (CWE-327)
	hash := md5.Sum([]byte(password))
	return fmt.Sprintf("%x", hash)
}`,

  sql: `-- Security Audit Demo SQL Script
-- WARNING: Intentionally vulnerable patterns for SAST testing

-- 1. Hardcoded Master Credentials & Cleartext Storage (CWE-798 / CWE-312)
INSERT INTO admin_users (username, password_hash, secret_api_key)
VALUES ('admin', '5f4dcc3b5aa765d61d8327deb882cf99', 'sk_live_99887766554433221100');

-- 2. Dangerous Stored Procedure / Dynamic Execution Injection (CWE-89)
CREATE PROCEDURE FindUserByInput @Username NVARCHAR(100)
AS
BEGIN
    -- Dynamic T-SQL execution susceptible to SQL Injection
    EXEC('SELECT * FROM accounts WHERE user_name = ''' + @Username + '''');
END;

-- 3. Excessive Grants / Privilege Escalation Risk (CWE-250)
GRANT ALL PRIVILEGES ON *.* TO 'public_user'@'%' WITH GRANT OPTION;

-- 4. Insecure Legacy Hash Function Usage (CWE-327)
SELECT id, username, MD5(password_plaintext) FROM legacy_users;`,

  bash: `#!/bin/bash
# Security Audit Demo Shell Script

# 1. Hardcoded Credentials & API Keys (CWE-798)
ADMIN_PASSWORD="root_password_2024"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# 2. Command Injection via Unquoted / Evaluated User Input (CWE-78 / CWE-95)
function process_user_file() {
    user_filename="$1"
    # Unsafe eval execution
    eval "cat /var/log/app/$user_filename"
}

# 3. Insecure Temporary File Creation (CWE-377)
function create_temp_log() {
    # Predictable temporary file location susceptible to symlink attacks
    TEMP_FILE="/tmp/app_debug_log.txt"
    echo "Processing data..." > "$TEMP_FILE"
}

# 4. Weak Cryptographic Checksum (CWE-327)
function checksum_pass() {
    echo -n "$1" | md5sum | cut -d' ' -f1
}`,
};

export const getDemoSnippet = (language: string): string => {
  const langKey = language ? language.toLowerCase() : 'python';
  return DEMO_SNIPPETS[langKey] || DEMO_SNIPPETS['python'];
};

export const isDemoCode = (currentCode: string): boolean => {
  if (!currentCode) return false;
  const trimmed = currentCode.trim();
  if (!trimmed) return false;
  return Object.values(DEMO_SNIPPETS).some((snippet) => snippet.trim() === trimmed);
};
