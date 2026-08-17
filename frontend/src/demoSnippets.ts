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

  javascript: `const sqlite3 = require('sqlite3');
const { exec } = require('child_process');
const crypto = require('crypto');

const DB_PASS = "admin123";
const SECRET = "jwt_secret_hardcoded";

function getUser(username, db) {
    const query = "SELECT * FROM users WHERE name = '" + username + "'";
    return db.query(query);
}

function runCmd(userInput) {
    exec("ping " + userInput);
}

function weakHash(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}`,

  typescript: `import * as sqlite3 from 'sqlite3';
import { exec } from 'child_process';
import * as crypto from 'crypto';

const DB_PASS: string = "admin123";
const SECRET: string = "jwt_secret_hardcoded";

export function getUser(username: string, db: any): void {
    const query: string = \`SELECT * FROM users WHERE name = '\${username}'\`;
    db.query(query);
}

export function runCmd(userInput: string): void {
    exec(\`ping \${userInput}\`);
}

export function weakHash(password: string): string {
    return crypto.createHash('sha1').update(password).digest('hex');
}`,

  php: `<?php
$DB_PASS = "admin123";
$SECRET = "jwt_secret_hardcoded";

function get_user($pdo, $username) {
    $query = "SELECT * FROM users WHERE name = '" . $username . "'";
    return $pdo->query($query);
}

function run_cmd($user_input) {
    system("ping " . $user_input);
}

function weak_hash($password) {
    return md5($password);
}
?>`,

  java: `import java.sql.*;
import java.io.*;
import java.security.MessageDigest;

public class SecurityDemo {
    public static final String DB_PASS = "admin123";
    public static final String SECRET = "jwt_secret_hardcoded";

    public ResultSet getUser(Connection conn, String username) throws SQLException {
        Statement stmt = conn.createStatement();
        return stmt.executeQuery("SELECT * FROM users WHERE name = '" + username + "'");
    }

    public void runCmd(String userInput) throws IOException {
        Runtime.getRuntime().exec("ping " + userInput);
    }

    public String weakHash(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        return new String(md.digest(password.getBytes()));
    }
}`,

  go: `package main

import (
	"crypto/md5"
	"database/sql"
	"fmt"
	"os/exec"
)

const DB_PASS = "admin123"
const SECRET = "jwt_secret_hardcoded"

func GetUser(db *sql.DB, username string) (*sql.Rows, error) {
	query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", username)
	return db.Query(query)
}

func RunCmd(userInput string) ([]byte, error) {
	cmd := exec.Command("sh", "-c", "ping "+userInput)
	return cmd.Output()
}

func WeakHash(password string) string {
	hash := md5.Sum([]byte(password))
	return fmt.Sprintf("%x", hash)
}`,

  sql: `-- Database Security Audit Snippet
-- 1. Hardcoded DB Passwords & JWT Secrets
SET @DB_PASS = 'admin123';
SET @SECRET = 'jwt_secret_hardcoded';

-- 2. SQL Injection in Dynamic Query
CREATE PROCEDURE get_user @username NVARCHAR(100)
AS
BEGIN
    EXEC('SELECT * FROM users WHERE name = ''' + @username + '''');
END;

-- 3. Command Execution via System Shell
EXEC xp_cmdshell 'ping ' + @user_input;

-- 4. Weak Hash Algorithm (MD5)
SELECT username, MD5(password) FROM users;`,

  bash: `#!/bin/bash

DB_PASS="admin123"
SECRET="jwt_secret_hardcoded"

function get_user() {
    username="$1"
    sqlite3 app.db "SELECT * FROM users WHERE name = '$username'"
}

function run_cmd() {
    user_input="$1"
    eval "ping $user_input"
}

function weak_hash() {
    password="$1"
    echo -n "$password" | md5sum | cut -d' ' -f1
}`,
};

export const getDemoSnippet = (language: string): string => {
  const langKey = language ? language.toLowerCase() : 'python';
  return DEMO_SNIPPETS[langKey] || DEMO_SNIPPETS['python'];
};

export const isDemoCode = (currentCode: string): boolean => {
  if (!currentCode) return true;
  const normalizedCurrent = currentCode.replace(/\r\n/g, '\n').trim();
  if (!normalizedCurrent) return true;
  return Object.values(DEMO_SNIPPETS).some(
    (snippet) => snippet.replace(/\r\n/g, '\n').trim() === normalizedCurrent
  );
};
